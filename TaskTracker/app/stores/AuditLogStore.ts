import { Store } from "../classes/Store"
import { StoreManager } from "../classes/StoreManager";
import { AuditLogModel } from "../models/AuditLogModel";
import { AuditLogAction } from "../enums/AuditLogAction"
import { IStorePersistence } from "../interfaces/IStorePersistence";

export class AuditLogStore extends Store {
    constructor(storeManager: StoreManager, persistence: IStorePersistence, storeName: string) {
        super(storeManager, persistence, storeName, undefined);
    }

    public Log(storeName: string, action: AuditLogAction, recordIndex: number, property?: string, value?: any): void {
        let recIdx = this.InternalCreateRecord();   // no audit log for the audit log!
        let log = new AuditLogModel(storeName, action, recordIndex, property, value);
        this.SetRecord(recIdx, log);
        this.persistence.SaveAuditLog(log);
    }

    // Here we override the function because we don't want to log the audit log that calls SetRecord above.
    public SetRecord(idx: number, record: {}): Store {
        this.CreateRecordIfMissing(idx);
        this.data[idx] = record;

        return this;
    }

    // If we don't override this, calling CreateRecord here causes an infinite loop if the AuditLogStore doesn't exist yet,
    // because when the audit log store asks for its next sequence number, and the store doesn't exist,
    // SequenceStore.GetNext is called which calls CreateRecord, recursing into the Log function again.
    protected GetPrimaryKey(): {} {
        return {};
    }
}

