export class ParentChildRelationshipModel {
    parent: string;
    child: string;
    parentId: number;
    childId: number;

    constructor(parent: string, child: string, parentId: number, childId: number) {
        this.parent = parent;
        this.child = child;
        this.parentId = parentId;
        this.childId = childId;
    }
}
