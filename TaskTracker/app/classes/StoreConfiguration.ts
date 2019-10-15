import { StoreType } from "../enums/StoreType"

export class StoreConfiguration {
    storeType: StoreType;
    cached: boolean;
    data: any;

    constructor() {
        this.storeType = StoreType.Undefined;
        this.data = [];
    }

    public SetProperty(idx: number, property: string, value: any): StoreConfiguration {
        // Create additional records as necessary:
        while (this.data.length - 1 < idx) {
            this.data.push({});
        }

        this.data[idx][property] = value;
        this.UpdatePhysicalStorage(this.data[idx], property, value);

        return this;
    }

    private UpdatePhysicalStorage(record: any, property: string, value: string) {
        switch (this.storeType) {
            case StoreType.InMemory:
                // Do nothing.
                break;

            case StoreType.RestCall:
                // Eventually send an update but we probably ought to have a PK with which to associate the change.
                break;

            case StoreType.LocalStorage:
                // Here we just update the whole structure.
                let json = JSON.stringify(this.data);
                window.localStorage.setItem("Tasks", json);
                break;
        }
    }
}

