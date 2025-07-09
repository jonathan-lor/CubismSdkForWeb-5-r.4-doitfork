import { CubismJson, Value } from '../utils/cubismjson';
import { CubismIdHandle } from '../id/cubismid';

enum DisplayInfoFields {
    Parameters = "Parameters",
    ParameterGroups = "ParameterGroups",
    Parts = "Parts",
    // CombinedParameters = "CombinedParameters",
}

// main use case for this is to store two way mappings for parts and parameters described in a .cdi3.json file

// LOL AND PARTS AND PARAMETER TO CUBISMIDHANDLES
// throwing modularity and idiomatic naming out the window here. refactor when you have time after this blows up
export class CubismDisplayInfo {

    // map

    constructor() {}

    public static create(cdi3json: ArrayBuffer, size: number): CubismDisplayInfo {
        const json: CubismJson = CubismJson.create(cdi3json, size);
        if(!json) return null;

        const ret: CubismDisplayInfo = new CubismDisplayInfo();
        const root: Value = json.getRoot();

        // NOTE: There could be other fields in .cdi3.json that I don't know about. Update this if I ever run into any of them

        for (const field of Object.values(DisplayInfoFields)) {
            // assume non null means json array was returned
            const fieldJsonArray = root.getValueByString(field);
            if (!fieldJsonArray.isNull()) {
                const count: number = fieldJsonArray.getSize();

            }
        }
    }

    // public 
}