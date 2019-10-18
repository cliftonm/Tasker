define(["require", "exports", "./Store", "../enums/StoreType"], function (require, exports, Store_1, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StoreManager {
        constructor() {
            this.stores = {};
            this.getPrimaryKeyCallback = () => { };
        }
        CreateStore(storeName, storeType) {
            let store = new Store_1.Store(this, storeType, storeName);
            this.stores[storeName] = store;
            return store;
        }
        RegisterStore(store) {
            this.stores[store.storeName] = store;
        }
        AddInMemoryStore(storeName, data) {
            let store = new Store_1.Store(this, StoreType_1.StoreType.InMemory, storeName);
            store.SetData(data);
            this.stores[storeName] = store;
            return store;
        }
        GetStore(storeName) {
            return this.stores[storeName];
        }
        GetTypedStore(storeName) {
            // Compiler says: Conversion of type 'Store' to type 'T' may be a mistake because 
            // neither type sufficiently overlaps with the other.If this was intentional, 
            // convert the expression to 'unknown' first.
            // So how do I tell it that T must extended from Store?
            return this.stores[storeName];
        }
        // Eventually will support local stores, REST calls, caching, computational stores, and using other 
        // existing objects as stores.
        GetStoreData(storeName) {
            return this.stores[storeName].GetRawData();
        }
        GetPrimaryKey() {
            return this.getPrimaryKeyCallback();
        }
    }
    exports.StoreManager = StoreManager;
});
//# sourceMappingURL=StoreManager.js.map