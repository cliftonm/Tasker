import { TemplateBuilder } from "./TemplateBuilder";
import { StoreType } from "../enums/StoreType"
import { RowRecordMap } from "../interfaces/RowRecordMap"
import { StoreManager } from "./StoreManager";

type EmptyRecordResult = [boolean, {}[]];

export class Store {
    storeType: StoreType;
    cached: boolean;
    private data: RowRecordMap = {};
    storeName: string;
    storeManager: StoreManager;
    selectedRecordIndex: number = -1;        // multiple selection not allowed at the moment.
    recordCreatedCallback: (idx: number, record: {}, insert: boolean, store: Store, builder: TemplateBuilder) => void = () => { };
    propertyChangedCallback: (idx: number, field: string, value: any, store: Store, builder: TemplateBuilder) => void = () => { };
    recordDeletedCallback: (idx: number, store: Store, builder: TemplateBuilder) => void = () => { };         

    constructor(storeManager: StoreManager, storeType: StoreType, storeName: string) {
        this.storeManager = storeManager;
        this.storeType = storeType;
        this.storeName = storeName;
    }

    public Records(): number {
        // ECMA 5+ must use "keys", ECMA 7+ can use "entries"
        return Object.keys(this.data).length;
    }

    public FindRecord(where: (any) => boolean): number {
        let idx = -1;

        for (let k of Object.keys(this.data)) {
            if (where(this.data[k])) {
                idx = parseInt(k);
                break;
            }
        }

        return idx;
    }

    public FindRecords(where: (any) => boolean): number[] {
        let recs = [];

        for (let k of Object.keys(this.data)) {
            if (where(this.data[k])) {
                recs.push(k);
            }
        }

        return recs;
    }

    // Hmmm.  This returns the recIdx, whereas FindRecordsOfType<T> below returns T[]
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

    public FindRecordsOfType<T>(where: (T) => boolean): T[] {
        let recs = [];

        for (let k of Object.keys(this.data)) {
            if (where(<T>this.data[k])) {
                recs.push(this.data[k]);
            }
        }

        return recs;
    }

    public GetRawData(): {}[] {
        return jQuery.map(this.data, value => value);
    }

    public SetData(records: {}[]): void {
        this.data = {};
        records.forEach((record, idx) => this.data[idx] = record);
    }

    public GetRecord(idx: number): {} {
        return this.data[idx];
    }

    public SetRecord(idx: number, record: {}): Store {
        this.CreateRecordIfMissing(idx);
        this.data[idx] = record;

        return this;
    }

    public SetProperty(idx: number, field: string, value: any, builder?: TemplateBuilder): Store {
        this.CreateRecordIfMissing(idx);
        this.data[idx][field] = value;
        this.propertyChangedCallback(idx, field, value, this, builder);

        return this;
    }

    public GetProperty(idx: number, property: string): any {
        let value = undefined;

        if (this.data[idx]) {
            value = this.data[idx][property];
        }

        return value;
    }

    public CreateRecord(builder?: TemplateBuilder, insert = false): number {
        let nextIdx = 0;

        if (this.Records() > 0) {
            nextIdx = Math.max.apply(Math, Object.keys(this.data)) + 1;
        }

        this.data[nextIdx] = this.GetPrimaryKey();
        this.recordCreatedCallback(nextIdx, {}, insert, this, builder);

        return nextIdx;
    }

    public DeleteRecord(idx: number, builder?: TemplateBuilder) : void {
        this.recordDeletedCallback(idx, this, builder);
        delete this.data[idx];

        if (this.selectedRecordIndex == idx) {
            this.selectedRecordIndex = -1;
        }
    }

    public Load(createRecordView: boolean = true, builder?: TemplateBuilder): Store {
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

                        /*
                        let result = this.RemoveEmptyRecords(records);

                        if (result[0]) {
                            records = result[1];
                        }
                        */

                        records.forEach((record, idx) => this.data[idx] = record);

                        /*
                        if (result[0]) {
                            this.Save();
                        }
                        */

                    } catch (ex) {
                        console.log(ex);
                        // Storage is corrupt, eek, we're going to remove it!
                        window.localStorage.removeItem(this.storeName);
                    }
                }

                break;
        }

        if (createRecordView) {
            jQuery.each(this.data, (k, v) => this.recordCreatedCallback(k, v, false, this, builder));
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

    // This is temporary fix because I was accidentally creating empty records
    private RemoveEmptyRecords(records: {}[]): EmptyRecordResult {
        let found = false;
        let recs: number[] = [];

        for (let i = 0; i < records.length; i++) {
            if (Object.keys(records[i]).length) {
                recs.push(i);
                found = true;
            }
        }

        recs.reverse().forEach(n => records = records.splice(n, 1));

        return [found, records];
    }
}

