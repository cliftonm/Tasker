import { Store } from "./Store"
import { StoreType } from "../enums/StoreType"
import { KeyStoreMap } from "../interfaces/KeyStoreMap"

export class StoreManager {
    stores: KeyStoreMap = {};
    getPrimaryKeyCallback: (storeName: string) => any = () => {};

    public CreateStore(storeName: string, storeType: StoreType): Store {
        let store = new Store(this, storeType, storeName);
        this.stores[storeName] = store;

        return store;
    }

    public RegisterStore(store: Store): void {
        this.stores[store.storeName] = store;
    }

    public AddInMemoryStore(storeName: string, data: {}[]): Store {
        let store = new Store(this, StoreType.InMemory, storeName);
        store.SetData(data);
        this.stores[storeName] = store;

        return store;
    }

    public GetStore(storeName: string) : Store {
        return this.stores[storeName];
    }

    public GetTypedStore<T>(storeName: string): T {
        // Compiler says: Conversion of type 'Store' to type 'T' may be a mistake because 
        // neither type sufficiently overlaps with the other.If this was intentional, 
        // convert the expression to 'unknown' first.
        // So how do I tell it that T must extended from Store?
        return (<unknown>this.stores[storeName]) as T;
    }

    // Eventually will support local stores, REST calls, caching, computational stores, and using other 
    // existing objects as stores.
    public GetStoreData(storeName: string): any {
        return this.stores[storeName].GetRawData();
    }

    public GetPrimaryKey(storeName: string): {} {
        return this.getPrimaryKeyCallback(storeName);
    }
}