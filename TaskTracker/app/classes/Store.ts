﻿import { ViewController } from "./ViewController";
import { RowRecordMap } from "../interfaces/RowRecordMap"
import { StoreManager } from "./StoreManager";
import { AuditLogStore } from "../stores/AuditLogStore";
import { IStorePersistence } from "../interfaces/IStorePersistence";
import { AuditLogAction } from "../enums/AuditLogAction";

type EmptyRecordResult = [boolean, {}[]];

export class Store {
    persistence: IStorePersistence;
    cached: boolean;
    protected data: RowRecordMap = {};
    storeName: string;
    storeManager: StoreManager;
    auditLogStore: AuditLogStore;
    recordCreatedCallback: (idx: number, record: {}, insert: boolean, store: Store, onLoad: boolean, viewController: ViewController) => void = () => { };
    propertyChangedCallback: (idx: number, field: string, value: any, store: Store) => void = () => { };
    recordDeletedCallback: (idx: number, store: Store, viewController: ViewController) => void = () => { };         

    constructor(storeManager: StoreManager, persistence: IStorePersistence, storeName: string, auditLogStore: AuditLogStore) {
        this.storeManager = storeManager;
        this.persistence = persistence;
        this.storeName = storeName;
        this.auditLogStore = auditLogStore;
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

    // Should be used for in-memory store only.  This will not create an audit log.
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
        jQuery.each(record, (k, v) => this.auditLogStore.Log(this.storeName, AuditLogAction.Update, idx, k, v));

        return this;
    }

    public SetProperty(idx: number, field: string, value: any): Store {
        this.CreateRecordIfMissing(idx);
        this.data[idx][field] = value;
        this.propertyChangedCallback(idx, field, value, this);
        this.auditLogStore.Log(this.storeName, AuditLogAction.Update, idx, field, value);

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
        let nextIdx = this.InternalCreateRecord(insert, viewController);
        this.auditLogStore.Log(this.storeName, AuditLogAction.Create, nextIdx);

        return nextIdx;
    }

    protected InternalCreateRecord(insert = false, viewController: ViewController = undefined): number {
        let nextIdx = 1;

        if (this.Records() > 0) {
            // OK that the keys are actually strings.
            nextIdx = Math.max.apply(Math, Object.keys(this.data)) + 1;
        }

        this.data[nextIdx] = this.GetNextPrimaryKey();
        this.recordCreatedCallback(nextIdx, {}, insert, this, false, viewController);

        return nextIdx;
    }

    public DeleteRecord(idx: number, viewController?: ViewController) : void {
        this.recordDeletedCallback(idx, this, viewController);
        this.auditLogStore.Log(this.storeName, AuditLogAction.Delete, idx);
        delete this.data[idx];
    }

    public Load(createRecordView: boolean = true, viewController: ViewController = undefined): Store {
        this.persistence.Load(this.storeName).then(data => {

            this.data = data;

            if (createRecordView) {
                jQuery.each(this.data, (k, v) => this.recordCreatedCallback(k, v, false, this, true, viewController));
            }
        });

        return this;
    }

    public Clear(): Store {
        this.data = {};

        return this;
    }

    public Save(): Store {
        this.persistence.Save(this.storeName, this.data);

        return this;
    }

    /*
    public UpdatePhysicalStorage(idx: number, property: string, value: string): Store {
        // Parameters and record to be used by other functions.
        let record = this.data[idx];
        this.persistence.Update(this.storeName, this.data, record, idx, property, value);

        return this;
    }
    */

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

    protected GetNextPrimaryKey(): {} {
        return this.storeManager.GetNextPrimaryKey(this.storeName);
    }

    protected CreateRecordIfMissing(idx: number) : void {
        if (!this.data[idx]) {
            this.data[idx] = {};
            this.auditLogStore.Log(this.storeName, AuditLogAction.Create, idx);
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

