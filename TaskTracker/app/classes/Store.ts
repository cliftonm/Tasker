import { StoreType } from "../enums/StoreType"
import { RowRecordMap } from "../interfaces/RowRecordMap"
import { StoreManager } from "./StoreManager";

export class Store {
    storeType: StoreType;
    cached: boolean;
    private data: RowRecordMap = {};
    storeName: string;
    storeManager: StoreManager;
    selectedRecordIndex: number = undefined;        // multiple selection not allowed at the moment.
    recordCreatedCallback: (idx: number, record: {}, insert: boolean, store: Store) => void = () => { };         
    propertyChangedCallback: (idx: number, field: string, value: any, store: Store) => void = () => { };
    recordDeletedCallback: (idx: number, store: Store) => void = () => { };         

    constructor(storeManager: StoreManager, storeType: StoreType, storeName: string) {
        this.storeType = StoreType.Undefined;
        this.storeManager = storeManager;
        this.storeType = storeType;
        this.storeName = storeName;
    }

    public Records(): number {
        // ECMA 5+ must use "keys", ECMA 7+ can use "entries"
        return Object.keys(this.data).length;
    }

    public FindRecord(where: ({ }) => boolean): number {
        let idx = -1;

        for (let k of Object.keys(this.data)) {
            if (where(this.data[k])) {
                idx = parseInt(k);
                break;
            }
        }

        return idx;
    }

    public FindRecordOfType<T>(where: (T) => boolean): number {
        let idx = -1;

        for (let k of Object.keys(this.data)) {
            if (where(<T>this.data[k])) {
                idx = parseInt(k);
                break;
            }
        }

        return idx;
    }

    public GetRawData(): {}[] {
        return jQuery.map(this.data, value => value);
    }

    public SetData(records: {}[]): void {
        this.data = {};
        records.forEach((record, idx) => this.data[idx] = record);
    }

    public SetRecord(idx: number, record: {}): Store {
        this.CreateRecordIfMissing(idx);
        this.data[idx] = record;

        return this;
    }

    public SetProperty(idx: number, field: string, value: any): Store {
        this.CreateRecordIfMissing(idx);
        this.data[idx][field] = value;
        this.propertyChangedCallback(idx, field, value, this);

        return this;
    }

    public GetProperty(idx: number, property: string): any {
        this.CreateRecordIfMissing(idx);
        let value = this.data[idx][property];

        return value;
    }

    public CreateRecord(insert = false): number {
        let nextIdx = 0;

        if (this.Records() > 0) {
            nextIdx = Math.max.apply(Math, Object.keys(this.data)) + 1;
        }

        this.data[nextIdx] = this.GetPrimaryKey();
        this.recordCreatedCallback(nextIdx, {}, insert, this);

        return nextIdx;
    }

    public DeleteRecord(idx: number) : void {
        delete this.data[idx];
        this.recordDeletedCallback(idx, this);
    }

    public Load(): Store {
        this.data = {};

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
                    try {
                        // Create indices that map records to a "key", in this case simply the initial row number.
                        let records: {}[] = JSON.parse(json);
                        records.forEach((record, idx) => this.data[idx] = record);
                    } catch (ex) {
                        console.log(ex);
                        // Storage is corrupt, eek, we're going to remove it!
                        window.localStorage.removeItem(this.storeName);
                    }
                }

                break;
        }

        jQuery.each(this.data, (k, v) => this.recordCreatedCallback(k, v, false, this));

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
        this.CreateRecordIfMissing(idx);

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

    protected GetPrimaryKey(): {} {
        return this.storeManager.GetPrimaryKey(this.storeName);
    }

    private CreateRecordIfMissing(idx: number) : void {
        if (!this.data[idx]) {
            this.data[idx] = {};
        }
    }

    private SaveToLocalStorage() {
        let json = JSON.stringify(this.GetRawData());
        window.localStorage.setItem(this.storeName, json);
    }
}

