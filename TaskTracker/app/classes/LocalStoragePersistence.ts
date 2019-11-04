import { RowRecordMap } from "../interfaces/RowRecordMap"
import { IStorePersistence } from "../interfaces/IStorePersistence"
import { AuditLogStore } from "../stores/AuditLogStore"
import { AuditLogModel } from "../models/AuditLogModel";

export class LocalStoragePersistence implements IStorePersistence {
    auditLogStore: AuditLogStore;

    public SetAuditLogStore(auditLogStore: AuditLogStore): void {
        this.auditLogStore = auditLogStore;
    }

    public Load(storeName: string): Promise<RowRecordMap> {
        let json = window.localStorage.getItem(storeName);
        let data = {};

        if (json) {
            try {
                // Create indices that map records to a "key", in this case simply the initial row number.
                let records: {}[] = JSON.parse(json);
                records.forEach((record, idx) => data[idx] = record);
            } catch (ex) {
                console.log(ex);
                // Storage is corrupt, eek, we're going to remove it!
                window.localStorage.removeItem(storeName);
            }
        }

        return new Promise((resolve, reject) => resolve(data));
    }

    public Save(storeName: string, data: RowRecordMap): void {
        let rawData = jQuery.map(data, value => value);
        let json = JSON.stringify(rawData);
        window.localStorage.setItem(storeName, json);
    }

    public LoadAuditLog(): void {
        this.Load("AuditLogStore").then(data => this.auditLogStore.data = data);
    }

    // logEntry has already been created in the store, all we need to do is save
    // the store to local storage.
    public SaveAuditLog(logEntry: AuditLogModel): void {
        this.Save("AuditLogStore", this.auditLogStore.data);
    }
}
