import { StoreConfiguration } from "./StoreConfiguration"
import { StoreType } from "../enums/StoreType"
import { KeyStoreMap } from "../interfaces/KeyStoreMap"

export class Store {
    stores: KeyStoreMap = {};

    public CreateStore(key: string, type: StoreType): StoreConfiguration {
        let storeCfg = new StoreConfiguration();
        this.stores[key] = storeCfg;

        return storeCfg;
    }

    public AddInMemoryStore(key: string, data: object[]): StoreConfiguration {
        let store = new StoreConfiguration();
        store.storeType = StoreType.InMemory;
        store.data = data;
        this.stores[key] = store;

        return store;
    }

    public GetStore(key: string) {
        return this.stores[key];
    }

    // Eventually will support local stores, REST calls, caching, computational stores, and using other 
    // existing objects as stores.
    public GetStoreData(key: string) {
        return this.stores[key].data;
    }
}