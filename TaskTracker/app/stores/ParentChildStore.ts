import { Store } from "../classes/Store"
import { ParentChildRelationshipModel } from "../models/ParentChildRelationshipModel"
import { ChildRecordInfo } from "../interfaces/ChildRecordInfo"

export class ParentChildStore extends Store {
    // let relationships = <ParentChildRelationshipModel[]>(this.GetRawData() as unknown);

    AddRelationship(parentStore: Store, childStore: Store, childRecIdx: number): void {
        let parentRecIdx = parentStore.selectedRecordIndex;

        if (parentRecIdx !== undefined) {
            let recIdx = this.CreateRecord();
            let parentId = parentStore.GetProperty(parentRecIdx, "__ID");
            let childId = childStore.GetProperty(childRecIdx, "__ID");
            let rel = new ParentChildRelationshipModel(parentStore.storeName, childStore.storeName, parentId, childId);
            this.SetRecord(recIdx, rel);
            this.Save();
        } else {
            // callback that parent record needs to be selected?
            // or throw an exception?
        }
    }

    GetChildRecords(parent: string, parentId: number, child: string): ChildRecordInfo {
        let childRecs = this.FindRecordsOfType<ParentChildRelationshipModel>(rel => rel.parent == parent && rel.parentId == parentId && rel.child == child);
        let childRecIds = childRecs.map(r => r.childId);
        let childStore = this.storeManager.GetStore(child);

        // Annoying.  VS2017 doesn't have an option for ECMAScript 7
        let recs = childStore.FindRecords(r => childRecIds.indexOf((<any>r).__ID) != -1);

        return { store: childStore, childrenIndices: recs };
    }
}
