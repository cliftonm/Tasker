import { RowRecordMap } from "../interfaces/RowRecordMap"
import { IStorePersistence } from "../interfaces/IStorePersistence"
import { Guid } from "./Guid"
import { StoreManager } from "./StoreManager"
import { AuditLogStore } from "../stores/AuditLogStore"
import { AuditLogModel } from "../models/AuditLogModel";

export class CloudPersistence implements IStorePersistence {
    baseUrl: string;
    userId: Guid;
    auditLogStore: AuditLogStore;
    storeManager: StoreManager;

    constructor(url: string, userId: Guid, storeManager : StoreManager) {
        this.baseUrl = url;
        this.userId = userId;
        this.storeManager = storeManager;
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
        // let json = JSON.stringify(rawData);
        jQuery.post(this.UrlWithUserId("ImportChanges"), JSON.stringify({ entries: rawData }));

        // TODO: Side effect!
        this.auditLogStore.Clear();
    }

    // Does nothing when using cloud persistence as we don't need to load the audit log.
    public LoadAuditLog(): void { }

    // Only the log entry is posted to the server.  The entire log is NOT sent!
    public SaveAuditLog(logEntry: AuditLogModel): void {
        let json = JSON.stringify(logEntry);
        jQuery.post(this.UrlWithUserId("SaveLogEntry"), json);
    }

    // Exports the in-memory current state of the audit log which is assumed to be something persisted by local storage or other in-memory scheme.
    // TODO: This is identical to the Save function above except for now, the auditLogStore isn't being cleared!
    public Export(logStore: AuditLogStore): void {
        let rawData = logStore.GetRawData(); // jQuery.map(logStore.GetRawData(), d => { return { logEntry: d }; });
        // let json = JSON.stringify(rawData);
        // Amusingly, the client-side UI says "Export", but from the server's perspective, this is an import!
        jQuery.post(this.UrlWithUserId("ImportChanges"), JSON.stringify({ entries: rawData }));
    }

    public ExportAll(entities: string[]): void {
        console.log("Begin transation");
        jQuery.when(jQuery.post(this.UrlWithUserId("BeginTransaction"))).then(() => {
            let calls: JQueryXHR[] = [];

            entities.forEach(e => this.ExportStore(calls, e));

            // Also save the sequence store, parent-child relationship store, and audit log store.
            this.ExportStore(calls, "Sequences");
            this.ExportStore(calls, "ParentChildRelationships");
            this.ExportStore(calls, "AuditLogStore");

            /*
                https://api.jquery.com/jQuery.when/
                In the multiple-Deferreds case where one of the Deferreds is rejected, jQuery.when() immediately fires the failCallbacks for its master Deferred. 
                Note that some of the Deferreds may still be unresolved at that point. The arguments passed to the failCallbacks match the signature of the failCallback 
                for the Deferred that was rejected. If you need to perform additional processing for this case, such as canceling any unfinished Ajax requests, you can 
                keep references to the underlying jqXHR objects in a closure and inspect/cancel them in the failCallback.
            */
            jQuery.when.apply(this, calls).then(
                () => {
                    console.log("Committing transation");
                    jQuery.post(this.UrlWithUserId("CommitTransaction"));
                },
                (d) => {
                    console.log("Rollback: ");
                    console.log(d);
                    calls.forEach(c => c.abort());
                    jQuery.post(this.UrlWithUserId("RollbackTransaction"));
                }
            );
        });
    }

    private ExportStore(calls: JQueryXHR[], storeName: string): void {
        let storeData = this.storeManager.GetStoreData(storeName);
        let xhr = undefined;

        if (storeData.length > 0) {
            console.log(`Export ${storeName}`);
            xhr = jQuery.post(
                this.UrlWithUserId("ImportEntity"),
                JSON.stringify({ storeName: storeName, storeData: storeData }),
            ).fail(err => {
                // console.log(err.responseJSON.Error);
                });

            calls.push(xhr);
        }
    }

    private Url(path: string): string {
        return this.baseUrl + path;
    }

    private UrlWithUserId(path: string): string {
        return this.baseUrl + path + this.AddParams({ UserId: this.userId.ToString() });
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
