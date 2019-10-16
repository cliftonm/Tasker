import { Store } from "./Store"
import { StoreType } from "../enums/StoreType"
import { KeyStoreMap } from "../interfaces/KeyStoreMap"

export class StoreManager {
    stores: KeyStoreMap = {};

    public CreateStore(key: string, storeType: StoreType): Store {
        let store = new Store();
        store.storeType = storeType;
        store.storeName = key;
        this.stores[key] = store;

        return store;
    }

    public AddInMemoryStore(key: string, data: {}[]): Store {
        let store = new Store();
        store.storeType = StoreType.InMemory;
        store.SetData(data);
        this.stores[key] = store;

        return store;
    }

    public GetStore(key: string) : Store {
        return this.stores[key];
    }

    // Eventually will support local stores, REST calls, caching, computational stores, and using other 
    // existing objects as stores.
    public GetStoreData(key: string): any {
        return this.stores[key].GetRawData();
    }
}