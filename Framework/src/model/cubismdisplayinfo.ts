import { CubismJson, Value } from '../utils/cubismjson';

enum DisplayInfoFields {
    Parameters = "Parameters",
    ParameterGroups = "ParameterGroups",
    Parts = "Parts",
    CombinedParameters = "CombinedParameters",
}

export class CubismDisplayInfo {
    constructor() {}

    public static create(cdi3json: ArrayBuffer, size: number): CubismDisplayInfo {
        const json: CubismJson = CubismJson.create(cdi3json, size);
        if(!json) return null;

        const ret: CubismDisplayInfo = new CubismDisplayInfo();
        const root: Value = json.getRoot();

        // NOTE: There could be other fields in .cdi3.json that I don't know about. Update this if I ever run into any of them

        // for (const field of Object.values(DisplayInfoFields))

    }
}