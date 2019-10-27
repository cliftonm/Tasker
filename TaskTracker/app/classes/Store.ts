import { ViewController } from "./ViewController";
import { StoreType } from "../enums/StoreType"
import { RowRecordMap } from "../interfaces/RowRecordMap"
import { StoreManager } from "./StoreManager";
import { IStorePersistence } from "../interfaces/IStorePersistence";

type EmptyRecordResult = [boolean, {}[]];

export class Store {
    persistence: IStorePersistence;
    cached: boolean;
    private data: RowRecordMap = {};
    storeName: string;
    storeManager: StoreManager;
    recordCreatedCallback: (idx: number, record: {}, insert: boolean, store: Store, onLoad: boolean, viewController: ViewController) => void = () => { };
    propertyChangedCallback: (idx: number, field: string, value: any, store: Store) => void = () => { };
    recordDeletedCallback: (idx: number, store: Store, viewController: ViewController) => void = () => { };         

    constructor(storeManager: StoreManager, persistence: IStorePersistence, storeName: string) {
        this.storeManager = storeManager;
        this.persistence = persistence;
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

    public SetProperty(idx: number, field: string, value: any): Store {
        this.CreateRecordIfMissing(idx);
        this.data[idx][field] = value;
        this.propertyChangedCallback(idx, field, value, this);

        return this;
    }

    public GetProperty(idx: number, property: string): any {
        let value = undefined;

        if (this.data[idx]) {
            value = this.data[idx][property];
        }

        return value;
    }

    public CreateRecord(insert = false, viewController: ViewController = undefined): number {
        let nextIdx = 0;

        if (this.Records() > 0) {
            nextIdx = Math.max.apply(Math, Object.keys(this.data)) + 1;
        }

        this.data[nextIdx] = this.GetPrimaryKey();
        this.recordCreatedCallback(nextIdx, {}, insert, this, false, viewController);

        return nextIdx;
    }

    public DeleteRecord(idx: number, viewController?: ViewController) : void {
        this.recordDeletedCallback(idx, this, viewController);
        delete this.data[idx];
    }

    public Load(createRecordView: boolean = true, viewController: ViewController = undefined): Store {
        this.data = this.persistence.Load(this.storeName);

        if (createRecordView) {
            jQuery.each(this.data, (k, v) => this.recordCreatedCallback(k, v, false, this, true, viewController));
        }

        return this;
    }

    public Save(): Store {
        this.persistence.Save(this.storeName, this.data);

        return this;
    }

    public UpdatePhysicalStorage(idx: number, property: string, value: string): Store {
        // Parameters and record to be used by other functions.
        let record = this.data[idx];
        this.persistence.Update(this.storeName, this.data, record, idx, property, value);

        return this;
    }

    public SetDefault(idx: number, property: string, value: any): Store {
        this.CreateRecordIfMissing(idx);

        if (!this.data[idx][property]) {
            this.data[idx][property] = value;
        }

        return this;
    }

    public GetRawData(): any {
        let rawData = jQuery.map(this.data, value => value);

        return rawData;
    }

    protected GetPrimaryKey(): {} {
        return this.storeManager.GetPrimaryKey(this.storeName);
    }

    private CreateRecordIfMissing(idx: number) : void {
        if (!this.data[idx]) {
            this.data[idx] = {};
        }
    }

    /*
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
    */
}

