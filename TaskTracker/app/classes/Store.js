define(["require", "exports", "../enums/AuditLogAction"], function (require, exports, AuditLogAction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Store {
        constructor(storeManager, persistence, storeName, auditLogStore) {
            this.data = {};
            this.recordCreatedCallback = () => { };
            this.propertyChangedCallback = () => { };
            this.recordDeletedCallback = () => { };
            this.storeManager = storeManager;
            this.persistence = persistence;
            this.storeName = storeName;
            this.auditLogStore = auditLogStore;
        }
        Records() {
            // ECMA 5+ must use "keys", ECMA 7+ can use "entries"
            return Object.keys(this.data).length;
        }
        FindRecord(where) {
            let idx = -1;
            for (let k of Object.keys(this.data)) {
                if (where(this.data[k])) {
                    idx = parseInt(k);
                    break;
                }
            }
            return idx;
        }
        FindRecords(where) {
            let recs = [];
            for (let k of Object.keys(this.data)) {
                if (where(this.data[k])) {
                    recs.push(k);
                }
            }
            return recs;
        }
        // Hmmm.  This returns the recIdx, whereas FindRecordsOfType<T> below returns T[]
        FindRecordOfType(where) {
            let idx = -1;
            for (let k of Object.keys(this.data)) {
                if (where(this.data[k])) {
                    idx = parseInt(k);
                    break;
                }
            }
            return idx;
        }
        FindRecordsOfType(where) {
            let recs = [];
            for (let k of Object.keys(this.data)) {
                if (where(this.data[k])) {
                    recs.push(this.data[k]);
                }
            }
            return recs;
        }
        // Should be used for in-memory store only.  This will not create an audit log.
        SetData(records) {
            this.data = {};
            records.forEach((record, idx) => this.data[idx] = record);
        }
        GetRecord(idx) {
            return this.data[idx];
        }
        SetRecord(idx, record) {
            this.CreateRecordIfMissing(idx);
            this.data[idx] = record;
            jQuery.each(record, (k, v) => this.auditLogStore.Log(this.storeName, AuditLogAction_1.AuditLogAction.Update, idx, k, v));
            return this;
        }
        SetProperty(idx, field, value) {
            this.CreateRecordIfMissing(idx);
            this.data[idx][field] = value;
            this.propertyChangedCallback(idx, field, value, this);
            this.auditLogStore.Log(this.storeName, AuditLogAction_1.AuditLogAction.Update, idx, field, value);
            return this;
        }
        GetProperty(idx, property) {
            let value = undefined;
            if (this.data[idx]) {
                value = this.data[idx][property];
            }
            return value;
        }
        CreateRecord(insert = false, viewController = undefined) {
            let nextIdx = this.InternalCreateRecord(insert, viewController);
            this.auditLogStore.Log(this.storeName, AuditLogAction_1.AuditLogAction.Create, nextIdx);
            return nextIdx;
        }
        InternalCreateRecord(insert = false, viewController = undefined) {
            let nextIdx = 1;
            if (this.Records() > 0) {
                nextIdx = Math.max.apply(Math, Object.keys(this.data)) + 1;
            }
            this.data[nextIdx] = this.GetPrimaryKey();
            this.recordCreatedCallback(nextIdx, {}, insert, this, false, viewController);
            return nextIdx;
        }
        DeleteRecord(idx, viewController) {
            this.recordDeletedCallback(idx, this, viewController);
            this.auditLogStore.Log(this.storeName, AuditLogAction_1.AuditLogAction.Delete, idx);
            delete this.data[idx];
        }
        Load(createRecordView = true, viewController = undefined) {
            this.persistence.Load(this.storeName).then(data => {
                this.data = data;
                if (createRecordView) {
                    jQuery.each(this.data, (k, v) => this.recordCreatedCallback(k, v, false, this, true, viewController));
                }
            });
            return this;
        }
        Clear() {
            this.data = {};
            return this;
        }
        Save() {
            this.persistence.Save(this.storeName, this.data);
            return this;
        }
        /*
        public UpdatePhysicalStorage(idx: number, property: string, value: string): Store {
            // Parameters and record to be used by other functions.
            let record = this.data[idx];
            this.persistence.Update(this.storeName, this.data, record, idx, property, value);
    
            return this;
        }
        */
        SetDefault(idx, property, value) {
            this.CreateRecordIfMissing(idx);
            if (!this.data[idx][property]) {
                this.data[idx][property] = value;
            }
            return this;
        }
        GetRawData() {
            let rawData = jQuery.map(this.data, value => value);
            return rawData;
        }
        GetPrimaryKey() {
            return this.storeManager.GetPrimaryKey(this.storeName);
        }
        CreateRecordIfMissing(idx) {
            if (!this.data[idx]) {
                this.data[idx] = {};
                this.auditLogStore.Log(this.storeName, AuditLogAction_1.AuditLogAction.Create, idx);
            }
        }
    }
    exports.Store = Store;
});
//# sourceMappingURL=Store.js.map