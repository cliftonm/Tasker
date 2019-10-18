import { Store } from "../classes/Store"
import { ParentChildRelationshipModel } from "../models/ParentChildRelationshipModel"

export class ParentChildStore extends Store {
    // let relationships = <ParentChildRelationshipModel[]>(this.GetRawData() as unknown);

    AddRelationship(parentStore: Store, childStore: Store, childRecIdx: number): void {
        let parentRecIdx = parentStore.selectedRecordIndex;

        if (parentRecIdx !== undefined) {
            let recIdx = this.CreateRecord();
            let parentID = parentStore.GetProperty(parentRecIdx, "__ID");
            let childID = childStore.GetProperty(childRecIdx, "__ID");
            let rel = new ParentChildRelationshipModel(parentStore.storeName, childStore.storeName, parentID, childID);
            this.SetRecord(recIdx, rel);
            this.Save();
        } else {
            // callback that parent record needs to be selected?
            // or throw an exception?
        }
    }
}
