define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AuditLogModel {
        constructor(storeName, action, recordIndex, property, value) {
            this.storeName = storeName;
            this.action = action;
            this.recordIndex = recordIndex;
            this.property = property;
            this.value = value;
        }
    }
    exports.AuditLogModel = AuditLogModel;
});
//# sourceMappingURL=AuditLogModel.js.map