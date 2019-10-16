define(["require", "exports", "../enums/StoreType"], function (require, exports, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Store {
        constructor() {
            this.data = {};
            this.recordChangedCallback = () => { };
            this.propertyChangedCallback = () => { };
            this.storeType = StoreType_1.StoreType.Undefined;
        }
        GetRawData() {
            return jQuery.map(this.data, value => value);
        }
        SetData(records) {
            this.data = {};
            records.forEach((record, idx) => this.data[idx] = record);
        }
        SetProperty(idx, field, value) {
            this.CreateRecordIfMissing(idx);
            this.data[idx][field] = value;
            this.propertyChangedCallback(idx, field, value, this);
            return this;
        }
        GetProperty(idx, property) {
            this.CreateRecordIfMissing(idx);
            let value = this.data[idx][property];
            return value;
        }
        Load() {
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
                            records.forEach((record, idx) => this.data[idx] = record);
                        }
                        catch (ex) {
                            console.log(ex);
                            // Storage is corrupt, eek, we're going to remove it!
                            window.localStorage.removeItem(this.storeName);
                        }
                    }
                    break;
            }
            jQuery.each(this.data, (k, v) => this.recordChangedCallback(k, v, this));
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
        SetDefault(idx, property, value) {
            this.CreateRecordIfMissing(idx);
            this.data[idx][property] = value;
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
        CreateRecordIfMissing(idx) {
            if (!this.data[idx]) {
                this.data[idx] = {};
            }
        }
        SaveToLocalStorage() {
            let json = JSON.stringify(this.GetRawData());
            window.localStorage.setItem(this.storeName, json);
        }
    }
    exports.Store = Store;
});
//# sourceMappingURL=Store.js.map