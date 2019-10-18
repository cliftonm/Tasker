define(["require", "exports", "../classes/Store", "../models/ParentChildRelationshipModel"], function (require, exports, Store_1, ParentChildRelationshipModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParentChildStore extends Store_1.Store {
        // let relationships = <ParentChildRelationshipModel[]>(this.GetRawData() as unknown);
        AddRelationship(parentStore, childStore, childRecIdx) {
            let parentRecIdx = parentStore.selectedRecordIndex;
            if (parentRecIdx !== undefined) {
                let recIdx = this.CreateRecord();
                let parentId = parentStore.GetProperty(parentRecIdx, "__ID");
                let childId = childStore.GetProperty(childRecIdx, "__ID");
                let rel = new ParentChildRelationshipModel_1.ParentChildRelationshipModel(parentStore.storeName, childStore.storeName, parentId, childId);
                this.SetRecord(recIdx, rel);
                this.Save();
            }
            else {
                // callback that parent record needs to be selected?
                // or throw an exception?
            }
        }
        GetChildRecords(parent, parentId, child) {
            let childRecs = this.FindRecordsOfType(rel => rel.parent == parent && rel.parentId == parentId && rel.child == child);
            let childRecIds = childRecs.map(r => r.childId);
            let childStore = this.storeManager.GetStore(child);
            // Annoying.  VS2017 doesn't have an option for ECMAScript 7
            let recs = childStore.FindRecords(r => childRecIds.indexOf(r.__ID) != -1);
            return { store: childStore, childrenIndices: recs };
        }
    }
    exports.ParentChildStore = ParentChildStore;
});
//# sourceMappingURL=ParentChildStore.js.map