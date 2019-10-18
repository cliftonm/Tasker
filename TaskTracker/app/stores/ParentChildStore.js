define(["require", "exports", "../classes/Store"], function (require, exports, Store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParentChildStore extends Store_1.Store {
        GetNextID() {
            let n = 0;
            let nextParentId = 0;
            let nextChildId = 0;
            let relationships = this.GetRawData();
            if (relationships.length > 0) {
                nextParentId = Math.max.apply(Math, relationships.map(r => r.parentId));
                nextChildId = Math.max.apply(Math, relationships.map(r => r.childId));
            }
            n = Math.max(nextParentId, nextChildId);
            return n;
        }
    }
    exports.ParentChildStore = ParentChildStore;
});
//# sourceMappingURL=ParentChildStore.js.map