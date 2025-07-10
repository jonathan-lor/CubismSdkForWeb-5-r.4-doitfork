import { CubismJson, Value } from '../utils/cubismjson';
import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';

enum DisplayInfoFields {
    Parameters = "Parameters",
    ParameterGroups = "ParameterGroups",
    Parts = "Parts",
    // CombinedParameters = "CombinedParameters",
}

// main use case for this is to store two way mappings for parts and parameters described in a .cdi3.json file

// LOL AND PARTS AND PARAMETER TO CUBISMIDHANDLES
// throwing modularity and idiomatic naming out the window here. refactor when you have time after this blows up

//CubismFrameworkIdManager.getId only accepts the parameter id. so we do still need mapping of name to id
// what about part

// may refactor to use cubism map
export class CubismDisplayInfo {

    // edge case here is if parameter/part name is duplicated between part and parameter
    // might not actually matter but just putting this note here in case
    // parameter name/id to cubismidhandle mapping

    private parameterNameToParameterIdMapping: Record<string, string>;

    private partNameToPartIdMapping: Record<string, string>;

    private parameterIdToCubismIdMapping: Record<string, CubismIdHandle>;

    private partIdToCubismIdMapping: Record<string, CubismIdHandle>

    constructor() {
        this.parameterNameToParameterIdMapping = Object.create(null);
        this.partNameToPartIdMapping = Object.create(null);
        this.parameterIdToCubismIdMapping = Object.create(null);
        this.partIdToCubismIdMapping = Object.create(null);
    }

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
                
                if (field === "Parameters") {
                    for(let i = 0; i < count; i++) {
                        const parameterInfo: Value = fieldJsonArray.getValueByIndex(i);
                        const id: string = parameterInfo.getValueByString("Id").getRawString();
                        const name: string = parameterInfo.getValueByString("Name").getRawString();
                        ret.parameterNameToParameterIdMapping[name] = id; 
                        ret.parameterIdToCubismIdMapping[id] = CubismFramework.getIdManager().getId(id);
                    }
                }

                if (field === "Parts") {
                    for(let i = 0; i < count; i++) {
                        const partInfo: Value = fieldJsonArray.getValueByIndex(i);
                        const id: string = partInfo.getValueByString("Id").getRawString();
                        const name: string = partInfo.getValueByString("Name").getRawString();
                        ret.partNameToPartIdMapping[name] = id; 
                        ret.partIdToCubismIdMapping[id] = CubismFramework.getIdManager().getId(id);
                    }
                }
            }
        }
        return ret;
    }

    public parameterIdToCubismId(parameterId: string): CubismIdHandle | undefined {
        return this.parameterIdToCubismIdMapping[parameterId];
    }

    public parameterNameToCubismId(parameterName: string): CubismIdHandle | undefined {
        const parameterId = this.parameterNameToParameterIdMapping[parameterName];
        if(!parameterId) return undefined;
        return this.parameterIdToCubismIdMapping[parameterId];
    }

    public partIdToCubismId(partId: string): CubismIdHandle | undefined{
        return this.partIdToCubismIdMapping[partId];
    }

    public partNameToCubismId(partName: string): CubismIdHandle | undefined {
        const partId = this.partNameToPartIdMapping[partName];
        if(!partId) return undefined;
        return this.partIdToCubismIdMapping[partId];
    }
}