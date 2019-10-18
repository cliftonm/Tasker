define(["require", "exports", "../classes/Store", "../models/ParentChildRelationshipModel"], function (require, exports, Store_1, ParentChildRelationshipModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParentChildStore extends Store_1.Store {
        // let relationships = <ParentChildRelationshipModel[]>(this.GetRawData() as unknown);
        AddRelationship(parentStore, childStore, childRecIdx) {
            let parentRecIdx = parentStore.selectedRecordIndex;
            if (parentRecIdx !== undefined) {
                let recIdx = this.CreateRecord();
                let parentID = parentStore.GetProperty(parentRecIdx, "__ID");
                let childID = childStore.GetProperty(childRecIdx, "__ID");
                let rel = new ParentChildRelationshipModel_1.ParentChildRelationshipModel(parentStore.storeName, childStore.storeName, parentID, childID);
                this.SetRecord(recIdx, rel);
                this.Save();
            }
            else {
                // callback that parent record needs to be selected?
                // or throw an exception?
            }
        }
    }
    exports.ParentChildStore = ParentChildStore;
});
//# sourceMappingURL=ParentChildStore.js.map