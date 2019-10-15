import { StoreConfiguration } from "./StoreConfiguration"
import { StoreType } from "../enums/StoreType"
import { KeyStoreMap } from "../interfaces/KeyStoreMap"

export class Store {
    stores: KeyStoreMap = {};

    public CreateStore(key: string, storeType: StoreType): StoreConfiguration {
        let storeCfg = new StoreConfiguration();
        storeCfg.storeType = storeType;
        this.stores[key] = storeCfg;

        return storeCfg;
    }

    public AddInMemoryStore(key: string, data: object[]): StoreConfiguration {
        let storeCfg = new StoreConfiguration();
        storeCfg.storeType = StoreType.InMemory;
        storeCfg.data = data;
        this.stores[key] = storeCfg;

        return storeCfg;
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