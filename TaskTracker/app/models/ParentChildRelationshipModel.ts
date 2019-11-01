export class ParentChildRelationshipModel {
    __ID: number;
    parent: string;
    child: string;
    parentId: number;
    childId: number;

    constructor(id: number, parent: string, child: string, parentId: number, childId: number) {
        this.__ID = id;
        this.parent = parent;
        this.child = child;
        this.parentId = parentId;
        this.childId = childId;
    }
}
