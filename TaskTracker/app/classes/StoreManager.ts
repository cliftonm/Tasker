import { IStorePersistence } from "../interfaces/IStorePersistence";
import { Store } from "./Store"
import { KeyStoreMap } from "../interfaces/KeyStoreMap"
import { AuditLogStore } from "../stores/AuditLogStore";

export class StoreManager {
    stores: KeyStoreMap = {};
    getNextPrimaryKeyCallback: (storeName: string) => any = () => { };

    public HasStore(storeName: string): boolean {
        return this.stores[storeName] !== undefined;
    }

    public CreateStore(storeName: string, persistence: IStorePersistence, auditLogStore: AuditLogStore): Store {
        let store = new Store(this, persistence, storeName, auditLogStore);
        this.stores[storeName] = store;

        return store;
    }

    public RegisterStore(store: Store): void {
        this.stores[store.storeName] = store;
    }

    public AddInMemoryStore(storeName: string, data: {}[]): Store {
        // In-memory store should never call persistence functions, thus undefined.
        // And no audit log for in-memory stores!
        let store = new Store(this, undefined, storeName, undefined);   
        store.SetData(data);
        this.stores[storeName] = store;

        return store;
    }

    public GetStore(storeName: string) : Store {
        return this.stores[storeName];
    }

    public GetTypedStore<T extends Store>(storeName: string): T {
        // Compiler says: Conversion of type 'Store' to type 'T' may be a mistake because 
        // neither type sufficiently overlaps with the other.If this was intentional, 
        // convert the expression to 'unknown' first.
        // So how do I tell it that T must extended from Store?
        return this.stores[storeName] as T;
    }

    // Eventually will support local stores, REST calls, caching, computational stores, and using other 
    // existing objects as stores.
    public GetStoreData(storeName: string): any {
        return this.stores[storeName].GetRawData();
    }

    public GetNextPrimaryKey(storeName: string): {} {
        return this.getNextPrimaryKeyCallback(storeName);
    }
}