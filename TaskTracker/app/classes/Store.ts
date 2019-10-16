import { StoreType } from "../enums/StoreType"

export class Store {
    storeType: StoreType;
    cached: boolean;
    data: any;
    storeName: string;

    constructor() {
        this.storeType = StoreType.Undefined;
        this.data = [];
    }

    public SetProperty(idx: number, property: string, value: any): Store {
        this.CreateNecessaryRecords(idx);
        this.data[idx][property] = value;

        return this;
    }

    public GetProperty(idx: number, property: string): any {
        this.CreateNecessaryRecords(idx);
        let value = this.data[idx][property];

        return value;
    }

    public Load(): Store {
        switch (this.storeType) {
            case StoreType.InMemory:
                // TODO: Probably should throw an exception -- how do you load a store that already is in memory???
                break;
            case StoreType.RestCall:
                // TODO: Implement
                break;

            case StoreType.LocalStorage:
                let json = window.localStorage.getItem(this.storeName);

                if (json) {
                    this.data = JSON.parse(json);
                }

                break;
        }

        return this;
    }

    public Save(): Store {
        switch (this.storeType) {
            case StoreType.InMemory:
                // TODO: throw exception?
                break;

            case StoreType.RestCall:
                // Eventually send an update but we probably ought to have a PK with which to associate the change.
                break;

            case StoreType.LocalStorage:
                // Here we just update the whole structure.
                this.SaveToLocalStorage();
                break;
        }

        return this;
    }

    public SetDefault(idx: number, property: string, value: any): Store {
        this.CreateNecessaryRecords(idx);

        if (!this.data[idx][property]) {
            this.data[idx][property] = value;
        }

        return this;
    }

    public UpdatePhysicalStorage(idx: number, property: string, value: string) : Store {
        // Parameters and record to be used by other functions.
        let record = this.data[idx];

        switch (this.storeType) {
            case StoreType.InMemory:
                // TODO: throw exception?
                break;

            case StoreType.RestCall:
                // Eventually send an update but we probably ought to have a PK with which to associate the change.
                break;

            case StoreType.LocalStorage:
                // Here we just update the whole structure.
                this.SaveToLocalStorage();
                break;
        }

        return this;
    }

    private CreateNecessaryRecords(idx: number) {
        // Create additional records as necessary:
        while (this.data.length - 1 < idx) {
            this.data.push({});
        }
    }

    private SaveToLocalStorage() {
        let json = JSON.stringify(this.data);
        window.localStorage.setItem(this.storeName, json);
    }
}

