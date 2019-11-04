import { Store } from "../classes/Store"
import { ParentChildRelationshipModel } from "../models/ParentChildRelationshipModel"
import { ChildRecordInfo } from "../interfaces/ChildRecordInfo"
import { EntityViewController } from "../classes/EntityViewController";

export class ParentChildStore extends Store {
    public AddRelationship(parentStore: Store, childStore: Store, parentRecIdx: number, childRecIdx: number): void {
        if (parentRecIdx != -1) {
            let recIdx = this.CreateRecord();
            let parentId = parentStore.GetProperty(parentRecIdx, "__ID");
            let childId = childStore.GetProperty(childRecIdx, "__ID");
            let id = this.GetProperty(recIdx, "__ID");
            let rel = new ParentChildRelationshipModel(id, parentStore.storeName, childStore.storeName, parentId, childId);
            this.SetRecord(recIdx, rel);
            this.Save();
        } else {
            // callback that parent record needs to be selected?
            // or throw an exception?
        }
    }

    public GetChildInfo(parent: string, parentId: number, child: string): ChildRecordInfo {
        let childRecs = this.FindRecordsOfType<ParentChildRelationshipModel>(rel => rel.parent == parent && rel.parentId == parentId && rel.child == child);
        let childRecIds = childRecs.map(r => r.childId);
        let childStore = this.storeManager.GetStore(child);

        if (!childStore) {
            console.log(`Child store ${child} doesn't exist!`);
        }

        // Annoying.  VS2017 doesn't have an option for ECMAScript 7
        let recs = childStore.FindRecords(r => childRecIds.indexOf((<any>r).__ID) != -1);

        return { store: childStore, childrenIndices: recs };
    }

    public DeleteRelationship(store: Store, recIdx: number, viewController: EntityViewController) {
        let storeName = store.storeName;
        let id = store.GetProperty(recIdx, "__ID");
        let touchedStores : string[] = [];     // So we save the store only once after this process.

        // safety check.
        if (id) {
            let parents = this.FindRecordsOfType<ParentChildRelationshipModel>(rel => rel.parent == storeName && rel.parentId == id);
            let children = this.FindRecordsOfType<ParentChildRelationshipModel>(rel => rel.child == storeName && rel.childId == id);

            console.log(`Num parents: ${parents.length}`);
            console.log(`Num children: ${children.length}`);

            // All parent relationships having a relationship to this entity as a child are deleted.
            parents.forEach(p => {
                // Get the view controller for this parent-child relationship.
                let vc = viewController.childControllers.find(pc => pc.store.storeName == p.child);
                this.DeleteChildrenOfParent(p, touchedStores, vc);
            });

            // All child relationships where this parent is this entity are deleted.
            children.forEach(c => {
                let relRecIdx = this.FindRecordOfType<ParentChildRelationshipModel>((r: ParentChildRelationshipModel) =>
                    r.parent == c.parent &&
                    r.parentId == c.parentId &&
                    r.child == c.child &&
                    r.childId == c.childId);
                this.DeleteRecord(relRecIdx);
            });
        } else {
            console.log(`Expected to have an __ID value in store ${storeName} record index: ${recIdx}`);
        }

        // Save all touched stores.
        touchedStores.forEach(s => this.storeManager.GetStore(s).Save());

        this.Save();
    }

    private DeleteChildrenOfParent(p: ParentChildRelationshipModel, touchedStores: string[], viewController: EntityViewController): void {
        let childStoreName = p.child;
        let childId = p.childId;
        let childStore = this.storeManager.GetStore(childStoreName);
        let recIdx = childStore.FindRecord(r => (<any>r).__ID == childId);

        // safety check.
        if (recIdx != -1) {
            // Recursive deletion of child's children will occur (I think - untested!)
            childStore.DeleteRecord(recIdx, viewController);

            if (touchedStores.indexOf(childStoreName) == -1) {
                touchedStores.push(childStoreName);
            }
        } else {
            console.log(`Expected to find record in store ${childStoreName} with __ID = ${childId}`);
        }

        // Delete the parent-child relationship.
        let relRecIdx = this.FindRecordOfType<ParentChildRelationshipModel>((r: ParentChildRelationshipModel) =>
            r.parent == p.parent &&
            r.parentId == p.parentId &&
            r.child == p.child &&
            r.childId == childId);

        this.DeleteRecord(relRecIdx);
    }
}
