define(["require", "exports", "./Store"], function (require, exports, Store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StoreManager {
        constructor() {
            this.stores = {};
            this.getPrimaryKeyCallback = () => { };
        }
        HasStore(storeName) {
            return this.stores[storeName] !== undefined;
        }
        CreateStore(storeName, persistence, auditLogStore) {
            let store = new Store_1.Store(this, persistence, storeName, auditLogStore);
            this.stores[storeName] = store;
            return store;
        }
        RegisterStore(store) {
            this.stores[store.storeName] = store;
        }
        AddInMemoryStore(storeName, data) {
            // In-memory store should never call persistence functions, thus undefined.
            // And no audit log for in-memory stores!
            let store = new Store_1.Store(this, undefined, storeName, undefined);
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
        GetPrimaryKey(storeName) {
            return this.getPrimaryKeyCallback(storeName);
        }
    }
    exports.StoreManager = StoreManager;
});
//# sourceMappingURL=StoreManager.js.map