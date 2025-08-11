/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { ICubismModelSetting } from '../icubismmodelsetting';
import { CubismIdHandle } from '../id/cubismid';
import { CubismModel } from '../model/cubismmodel';
import { csmVector } from '../type/csmvector';

/**
 * 自動まばたき機能
 *
 * 自動まばたき機能を提供する。
 */
export class CubismEyeBlink {
  /**
   * インスタンスを作成する
   * @param modelSetting モデルの設定情報
   * @return 作成されたインスタンス
   * @note 引数がNULLの場合、パラメータIDが設定されていない空のインスタンスを作成する。
   */
  public static create(
    modelSetting: ICubismModelSetting = null
  ): CubismEyeBlink {
    return new CubismEyeBlink(modelSetting);
  }

  /**
   * インスタンスの破棄
   * @param eyeBlink 対象のCubismEyeBlink
   */
  public static delete(eyeBlink: CubismEyeBlink): void {
    if (eyeBlink != null) {
      eyeBlink = null;
    }
  }

  /**
   * まばたきの間隔の設定
   * @param blinkingInterval まばたきの間隔の時間[秒]
   */
  public setBlinkingInterval(blinkingInterval: number): void {
    this._blinkingIntervalSeconds = blinkingInterval;
  }

  /**
   * まばたきのモーションの詳細設定
   * @param closing   まぶたを閉じる動作の所要時間[秒]
   * @param closed    まぶたを閉じている動作の所要時間[秒]
   * @param opening   まぶたを開く動作の所要時間[秒]
   */
  public setBlinkingSetting(
    closing: number,
    closed: number,
    opening: number
  ): void {
    this._closingSeconds = closing;
    this._closedSeconds = closed;
    this._openingSeconds = opening;
  }

  /**
   * まばたきさせるパラメータIDのリストの設定
   * @param parameterIds パラメータのIDのリスト
   */
  public setParameterIds(parameterIds: csmVector<CubismIdHandle>): void {
    this._parameterIds = parameterIds;
  }

  /**
   * まばたきさせるパラメータIDのリストの取得
   * @return パラメータIDのリスト
   */
  public getParameterIds(): csmVector<CubismIdHandle> {
    return this._parameterIds;
  }

  /**
   * モデルのパラメータの更新
   * @param model 対象のモデル
   * @param deltaTimeSeconds デルタ時間[秒]
   */
  public updateParameters(model: CubismModel, deltaTimeSeconds: number): void {
    this._userTimeSeconds += deltaTimeSeconds;
    let parameterValue: number;
    // normalized progress (0 -> 1) through the current phase (closing/closed/opening)
    let t = 0.0;
    const blinkingState: EyeState = this._blinkingState;

    switch (blinkingState) {
      case EyeState.EyeState_Closing:
        /*
        compute normalized progress, t as:
        elapsed / closingDuration, where
        elapsed = now (userTimeSeconds) - stateStart
        */
        t =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._closingSeconds;

        // clamp t at 1.0 on/after completion
        if (t >= 1.0) {
          t = 1.0;
          // transition to the next state (closing -> closed)
          this._blinkingState = EyeState.EyeState_Closed;
          // mark the new state's start time as now ("closed state starts at now, the end of closing")
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }

        // while closing is running, eye openness goes linearly from 1 -> 0 as t: 0 -> 1
        parameterValue = 1.0 - t;

        break;
      case EyeState.EyeState_Closed:
        // compute how long we've been holding eyes shut (same formula as above)
        t =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._closedSeconds;
        // once closed time has elapsed, switch state to opening and set opening state's start time to now
        if (t >= 1.0) {
          this._blinkingState = EyeState.EyeState_Opening;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }
        // parameter is always set to closed at close
        parameterValue = 0.0;

        break;
      case EyeState.EyeState_Opening:
        // compute normalized progress same as always
        t =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._openingSeconds;
        // transition to idle when complete
        if (t >= 1.0) {
          t = 1.0;
          this._blinkingState = EyeState.EyeState_Interval;
          // schedules when the next blink should be
          this._nextBlinkingTime = this.determinNextBlinkingTiming();
        }
        // while opening, eye param goes linearly from 0 to 1
        parameterValue = t;

        break;
      case EyeState.EyeState_Interval:
        // check if we've hit the next blink time
        if (this._nextBlinkingTime < this._userTimeSeconds) {
          this._blinkingState = EyeState.EyeState_Closing;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }
        // idle means eyes always open
        parameterValue = 1.0;

        break;
      // first (initial) or any unexpected state: bootstrap by setting state to Interval (idle) and start fully open
      case EyeState.EyeState_First:
      default:
        this._blinkingState = EyeState.EyeState_Interval;
        this._nextBlinkingTime = this.determinNextBlinkingTiming();

        parameterValue = 1.0;
        break;
    }

    if (!CubismEyeBlink.CloseIfZero) {
      parameterValue = -parameterValue;
    }

    for (let i = 0; i < this._parameterIds.getSize(); ++i) {
      model.setParameterValueById(this._parameterIds.at(i), Math.min(parameterValue, model.getParameterValueById(this._parameterIds.at(i))));
    }
  }

  /**
   * コンストラクタ
   * @param modelSetting モデルの設定情報
   */
  public constructor(modelSetting: ICubismModelSetting) {
    this._blinkingState = EyeState.EyeState_First;
    this._nextBlinkingTime = 0.0;
    this._stateStartTimeSeconds = 0.0;
    this._blinkingIntervalSeconds = 4.0;
    this._closingSeconds = 0.1;
    this._closedSeconds = 0.05;
    this._openingSeconds = 0.15;
    this._userTimeSeconds = 0.0;
    this._parameterIds = new csmVector<CubismIdHandle>();

    if (modelSetting == null) {
      return;
    }

    for (let i = 0; i < modelSetting.getEyeBlinkParameterCount(); ++i) {
      this._parameterIds.pushBack(modelSetting.getEyeBlinkParameterId(i));
    }
  }

  /**
   * 次の瞬きのタイミングの決定
   *
   * @return 次のまばたきを行う時刻[秒]
   */
  public determinNextBlinkingTiming(): number {
    const r: number = Math.random();
    return (
      this._userTimeSeconds + r * (2.0 * this._blinkingIntervalSeconds - 1.0)
    );
  }

  _blinkingState: number; // current state
  _parameterIds: csmVector<CubismIdHandle>; // list of ids for parameters to operate on
  _nextBlinkingTime: number; // time (seconds) for the next blink
  _stateStartTimeSeconds: number; // time (seconds) when the current state started (used to control how long we stay in each state)
  _blinkingIntervalSeconds: number; // blink interval (seconds)
  _closingSeconds: number; // duration (seconds) to spend closing the eyelids
  _closedSeconds: number; // duration (seconds) that the eyes are fully closed for
  _openingSeconds: number; // duration (seconds) to open the eyelids
  _userTimeSeconds: number; // accumulated delta time (seconds)

  /**
   * If the eye parameter specified by the ID is closed when its value is 0, return true
   * If it is closed when its value is 1 return false
   */
  static readonly CloseIfZero: boolean = true;
}

/**
 * Blink State
 *
 * Enum for blink state
 */
export enum EyeState {
  EyeState_First = 0, // Initial state
  EyeState_Interval, // State where the eyes are not blinking
  EyeState_Closing, // State where the eyelids are in the process of closing
  EyeState_Closed, // State where the eyelids are fully closed
  EyeState_Opening // State where the eyelids are in the process of opening
}

// Namespace definition for compatibility.
import * as $ from './cubismeyeblink';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismEyeBlink = $.CubismEyeBlink;
  export type CubismEyeBlink = $.CubismEyeBlink;
  export const EyeState = $.EyeState;
  export type EyeState = $.EyeState;
}
