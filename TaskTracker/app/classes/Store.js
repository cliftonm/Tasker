define(["require", "exports", "./StoreConfiguration", "../enums/StoreType"], function (require, exports, StoreConfiguration_1, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Store {
        constructor() {
            this.stores = {};
        }
        CreateStore(key, type) {
            let storeCfg = new StoreConfiguration_1.StoreConfiguration();
            this.stores[key] = storeCfg;
            return storeCfg;
        }
        AddInMemoryStore(key, data) {
            let store = new StoreConfiguration_1.StoreConfiguration();
            store.storeType = StoreType_1.StoreType.InMemory;
            store.data = data;
            this.stores[key] = store;
            return store;
        }
        GetStore(key) {
            return this.stores[key];
        }
        // Eventually will support local stores, REST calls, caching, computational stores, and using other 
        // existing objects as stores.
        GetStoreData(key) {
            return this.stores[key].data;
        }
    }
    exports.Store = Store;
});
//# sourceMappingURL=Store.js.map