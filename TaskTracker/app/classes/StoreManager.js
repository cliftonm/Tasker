define(["require", "exports", "./Store", "../enums/StoreType"], function (require, exports, Store_1, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StoreManager {
        constructor() {
            this.stores = {};
        }
        CreateStore(key, storeType) {
            let store = new Store_1.Store();
            store.storeType = storeType;
            store.storeName = key;
            this.stores[key] = store;
            return store;
        }
        AddInMemoryStore(key, data) {
            let store = new Store_1.Store();
            store.storeType = StoreType_1.StoreType.InMemory;
            store.SetData(data);
            this.stores[key] = store;
            return store;
        }
        GetStore(key) {
            return this.stores[key];
        }
        // Eventually will support local stores, REST calls, caching, computational stores, and using other 
        // existing objects as stores.
        GetStoreData(key) {
            return this.stores[key].GetRawData();
        }
    }
    exports.StoreManager = StoreManager;
});
//# sourceMappingURL=StoreManager.js.map