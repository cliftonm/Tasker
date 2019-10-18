import { Store } from "../classes/Store"
import { ParentChildRelationshipModel } from "../models/ParentChildRelationshipModel"

export class ParentChildStore extends Store {
    GetNextID(): number {
        let n = 0;
        let nextParentId = 0;
        let nextChildId = 0;
        let relationships = <ParentChildRelationshipModel[]>(this.GetRawData() as unknown);

        if (relationships.length > 0) {
            nextParentId = Math.max.apply(Math, relationships.map(r => r.parentId));
            nextChildId = Math.max.apply(Math, relationships.map(r => r.childId));
        }

        n = Math.max(nextParentId, nextChildId);

        return n;
    }
}
