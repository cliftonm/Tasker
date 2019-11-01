define(["require", "exports", "../classes/Store", "../models/AuditLogModel"], function (require, exports, Store_1, AuditLogModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AuditLogStore extends Store_1.Store {
        constructor(storeManager, persistence, storeName) {
            super(storeManager, persistence, storeName, undefined);
        }
        Log(storeName, action, recordIndex, property, value) {
            let recIdx = this.InternalCreateRecord(); // no audit log for the audit log!
            let id = this.storeManager.GetStore(storeName).GetProperty(recordIndex, "__ID");
            let log = new AuditLogModel_1.AuditLogModel(storeName, action, id, property, value);
            this.SetRecord(recIdx, log);
            this.persistence.SaveAuditLog(log);
        }
        // Here we override the function because we don't want to log the audit log that calls SetRecord above.
        SetRecord(idx, record) {
            this.CreateRecordIfMissing(idx);
            this.data[idx] = record;
            return this;
        }
        // If we don't override this, calling CreateRecord here causes an infinite loop if the AuditLogStore doesn't exist yet,
        // because when the audit log store asks for its next sequence number, and the store doesn't exist,
        // SequenceStore.GetNext is called which calls CreateRecord, recursing into the Log function again.
        GetNextPrimaryKey() {
            return {};
        }
    }
    exports.AuditLogStore = AuditLogStore;
});
//# sourceMappingURL=AuditLogStore.js.map