var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CloudPersistence {
        constructor(url, userId, storeManager) {
            this.baseUrl = url;
            this.userId = userId;
            this.storeManager = storeManager;
        }
        SetAuditLogStore(auditLogStore) {
            this.auditLogStore = auditLogStore;
        }
        Load(storeName) {
            return __awaiter(this, void 0, void 0, function* () {
                let records = yield jQuery.ajax({
                    url: this.Url("Load") + this.AddParams({ StoreName: storeName, UserId: this.userId.ToString() })
                });
                let data = {};
                // Create indices that map records to a "key", in this case simply the initial row number.
                // Note how we get the record index from record.__ID!!!
                records.forEach((record, _) => data[record.__ID] = record);
                return data;
            });
        }
        Save(storeName, data) {
            // For cloud persistence, what we actually want to do here is send over the audit log, not the entire store contents.
            let rawData = this.auditLogStore.GetRawData();
            // let json = JSON.stringify(rawData);
            jQuery.post(this.UrlWithUserId("ImportChanges"), JSON.stringify({ entries: rawData }));
            // TODO: Side effect!
            this.auditLogStore.Clear();
        }
        // Does nothing when using cloud persistence as we don't need to load the audit log.
        LoadAuditLog() { }
        // Only the log entry is posted to the server.  The entire log is NOT sent!
        SaveAuditLog(logEntry) {
            let json = JSON.stringify(logEntry);
            jQuery.post(this.UrlWithUserId("SaveLogEntry"), json);
        }
        // Exports the in-memory current state of the audit log which is assumed to be something persisted by local storage or other in-memory scheme.
        // TODO: This is identical to the Save function above except for now, the auditLogStore isn't being cleared!
        Export(logStore) {
            let rawData = logStore.GetRawData(); // jQuery.map(logStore.GetRawData(), d => { return { logEntry: d }; });
            // let json = JSON.stringify(rawData);
            // Amusingly, the client-side UI says "Export", but from the server's perspective, this is an import!
            jQuery.post(this.UrlWithUserId("ImportChanges"), JSON.stringify({ entries: rawData }));
        }
        ExportAll(entities) {
            console.log("Begin transation");
            jQuery.when(jQuery.post(this.UrlWithUserId("BeginTransaction"))).then(() => {
                let calls = [];
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
                jQuery.when.apply(this, calls).then(() => {
                    console.log("Committing transation");
                    jQuery.post(this.UrlWithUserId("CommitTransaction"));
                }, (d) => {
                    console.log("Rollback: ");
                    console.log(d);
                    calls.forEach(c => c.abort());
                    jQuery.post(this.UrlWithUserId("RollbackTransaction"));
                });
            });
        }
        ExportStore(calls, storeName) {
            let storeData = this.storeManager.GetStoreData(storeName);
            let xhr = undefined;
            if (storeData.length > 0) {
                console.log(`Export ${storeName}`);
                xhr = jQuery.post(this.UrlWithUserId("ImportEntity"), JSON.stringify({ storeName: storeName, storeData: storeData })).fail(err => {
                    // console.log(err.responseJSON.Error);
                });
                calls.push(xhr);
            }
        }
        Url(path) {
            return this.baseUrl + path;
        }
        UrlWithUserId(path) {
            return this.baseUrl + path + this.AddParams({ UserId: this.userId.ToString() });
        }
        AddParams(params) {
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
    exports.CloudPersistence = CloudPersistence;
});
//# sourceMappingURL=CloudPersistence.js.map