import { RowRecordMap } from "../interfaces/RowRecordMap"
import { IStorePersistence } from "../interfaces/IStorePersistence"
import { Guid } from "./Guid"
import { AuditLogStore } from "../stores/AuditLogStore"
import { AuditLogModel } from "../models/AuditLogModel";

export class CloudPersistence implements IStorePersistence {
    baseUrl: string;
    userId: Guid;
    auditLogStore: AuditLogStore;

    constructor(url: string, userId: Guid) {
        this.baseUrl = url;
        this.userId = userId;
    }

    public SetAuditLogStore(auditLogStore: AuditLogStore): void {
        this.auditLogStore = auditLogStore;
    }

    public async Load(storeName: string): Promise<RowRecordMap> {
        let records = await jQuery.ajax({
            url: this.Url("Load") + this.AddParams({ StoreName: storeName, UserId: this.userId.ToString() }) });
        let data = {};

        // Create indices that map records to a "key", in this case simply the initial row number.
        // Note how we get the record index from record.__ID!!!
        records.forEach((record, _) => data[record.__ID] = record);

        return data;
    }

    public Save(storeName: string, data: RowRecordMap): void {
        // For cloud persistence, what we actually want to do here is send over the audit log, not the entire store contents.
        let rawData = this.auditLogStore.GetRawData();
        let json = JSON.stringify(rawData);
        jQuery.post(this.Url("Save") + this.AddParams({ UserId: this.userId.ToString() }), JSON.stringify({ auditLog: json }));
        this.auditLogStore.Clear();
    }

    // Does nothing when using cloud persistence as we don't need to load the audit log.
    public LoadAuditLog(): void { }

    public SaveAuditLog(logEntry: AuditLogModel): void {
        let json = JSON.stringify(logEntry);
        jQuery.post(this.Url("SaveLogEntry") + this.AddParams({ UserId: this.userId.ToString() }), json);
    }

    private Url(path: string): string {
        return this.baseUrl + path;
    }

    private AddParams(params: {}): string {
        let ret = "";
        let separator = "?";

        Object.keys(params).forEach((k, v) => {
            ret = ret + separator;
            ret = ret + k + "=" + params[k];
            separator = "&";
        });

        return ret;
    }
}
