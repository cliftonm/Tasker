define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParentChildRelationshipModel {
        constructor(id, parent, child, parentId, childId) {
            this.__ID = id;
            this.parent = parent;
            this.child = child;
            this.parentId = parentId;
            this.childId = childId;
        }
    }
    exports.ParentChildRelationshipModel = ParentChildRelationshipModel;
});
//# sourceMappingURL=ParentChildRelationshipModel.js.map