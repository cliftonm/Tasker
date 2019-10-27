define(["require", "exports", "../enums/StoreType"], function (require, exports, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Store {
        constructor(storeManager, storeType, storeName) {
            this.data = {};
            this.selectedRecordIndex = -1; // multiple selection not allowed at the moment.
            this.recordCreatedCallback = () => { };
            this.propertyChangedCallback = () => { };
            this.recordDeletedCallback = () => { };
            this.storeManager = storeManager;
            this.storeType = storeType;
            this.storeName = storeName;
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
        GetRawData() {
            return jQuery.map(this.data, value => value);
        }
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
            return this;
        }
        SetProperty(idx, field, value, builder) {
            this.CreateRecordIfMissing(idx);
            this.data[idx][field] = value;
            this.propertyChangedCallback(idx, field, value, this);
            return this;
        }
        GetProperty(idx, property) {
            let value = undefined;
            if (this.data[idx]) {
                value = this.data[idx][property];
            }
            return value;
        }
        CreateRecord(insert = false) {
            let nextIdx = 0;
            if (this.Records() > 0) {
                nextIdx = Math.max.apply(Math, Object.keys(this.data)) + 1;
            }
            this.data[nextIdx] = this.GetPrimaryKey();
            this.recordCreatedCallback(nextIdx, {}, insert, this, false);
            return nextIdx;
        }
        DeleteRecord(idx) {
            this.recordDeletedCallback(idx, this);
            delete this.data[idx];
            if (this.selectedRecordIndex == idx) {
                this.selectedRecordIndex = -1;
            }
        }
        Load(createRecordView = true) {
            this.data = {};
            switch (this.storeType) {
                case StoreType_1.StoreType.InMemory:
                    // TODO: Probably should throw an exception -- how do you load a store that already is in memory???
                    break;
                case StoreType_1.StoreType.RestCall:
                    // TODO: Implement
                    break;
                case StoreType_1.StoreType.LocalStorage:
                    let json = window.localStorage.getItem(this.storeName);
                    if (json) {
                        try {
                            // Create indices that map records to a "key", in this case simply the initial row number.
                            let records = JSON.parse(json);
                            /*
                            let result = this.RemoveEmptyRecords(records);
    
                            if (result[0]) {
                                records = result[1];
                            }
                            */
                            records.forEach((record, idx) => this.data[idx] = record);
                            /*
                            if (result[0]) {
                                this.Save();
                            }
                            */
                        }
                        catch (ex) {
                            console.log(ex);
                            // Storage is corrupt, eek, we're going to remove it!
                            window.localStorage.removeItem(this.storeName);
                        }
                    }
                    break;
            }
            if (createRecordView) {
                jQuery.each(this.data, (k, v) => this.recordCreatedCallback(k, v, false, this, true));
            }
            return this;
        }
        SetDefault(idx, property, value) {
            this.CreateRecordIfMissing(idx);
            if (!this.data[idx][property]) {
                this.data[idx][property] = value;
            }
            return this;
        }
        Save() {
            switch (this.storeType) {
                case StoreType_1.StoreType.InMemory:
                    // TODO: throw exception?
                    break;
                case StoreType_1.StoreType.RestCall:
                    // Eventually send an update but we probably ought to have a PK with which to associate the change.
                    break;
                case StoreType_1.StoreType.LocalStorage:
                    // Here we just update the whole structure.
                    this.SaveToLocalStorage();
                    break;
            }
            return this;
        }
        UpdatePhysicalStorage(idx, property, value) {
            // Parameters and record to be used by other functions.
            let record = this.data[idx];
            switch (this.storeType) {
                case StoreType_1.StoreType.InMemory:
                    // TODO: throw exception?
                    break;
                case StoreType_1.StoreType.RestCall:
                    // Eventually send an update but we probably ought to have a PK with which to associate the change.
                    break;
                case StoreType_1.StoreType.LocalStorage:
                    // Here we just update the whole structure.
                    this.SaveToLocalStorage();
                    break;
            }
            return this;
        }
        GetPrimaryKey() {
            return this.storeManager.GetPrimaryKey(this.storeName);
        }
        CreateRecordIfMissing(idx) {
            if (!this.data[idx]) {
                this.data[idx] = {};
            }
        }
        SaveToLocalStorage() {
            let json = JSON.stringify(this.GetRawData());
            window.localStorage.setItem(this.storeName, json);
        }
        // This is temporary fix because I was accidentally creating empty records
        RemoveEmptyRecords(records) {
            let found = false;
            let recs = [];
            for (let i = 0; i < records.length; i++) {
                if (Object.keys(records[i]).length) {
                    recs.push(i);
                    found = true;
                }
            }
            recs.reverse().forEach(n => records = records.splice(n, 1));
            return [found, records];
        }
    }
    exports.Store = Store;
});
//# sourceMappingURL=Store.js.map