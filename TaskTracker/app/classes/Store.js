define(["require", "exports", "../enums/StoreType"], function (require, exports, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Store {
        constructor() {
            this.storeType = StoreType_1.StoreType.Undefined;
            this.data = [];
        }
        SetProperty(idx, property, value) {
            this.CreateNecessaryRecords(idx);
            this.data[idx][property] = value;
            return this;
        }
        GetProperty(idx, property) {
            this.CreateNecessaryRecords(idx);
            let value = this.data[idx][property];
            return value;
        }
        Load() {
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
                        this.data = JSON.parse(json);
                    }
                    break;
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
        SetDefault(idx, property, value) {
            this.CreateNecessaryRecords(idx);
            if (!this.data[idx][property]) {
                this.data[idx][property] = value;
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
        CreateNecessaryRecords(idx) {
            // Create additional records as necessary:
            while (this.data.length - 1 < idx) {
                this.data.push({});
            }
        }
        SaveToLocalStorage() {
            let json = JSON.stringify(this.data);
            window.localStorage.setItem(this.storeName, json);
        }
    }
    exports.Store = Store;
});
//# sourceMappingURL=Store.js.map