define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LocalStoragePersistence {
        SetAuditLogStore(auditLogStore) {
            this.auditLogStore = auditLogStore;
        }
        Load(storeName) {
            let json = window.localStorage.getItem(storeName);
            let data = {};
            if (json) {
                try {
                    // Create indices that map records to a "key", in this case simply the initial row number.
                    let records = JSON.parse(json);
                    records.forEach((record, idx) => data[idx] = record);
                }
                catch (ex) {
                    console.log(ex);
                    // Storage is corrupt, eek, we're going to remove it!
                    window.localStorage.removeItem(storeName);
                }
            }
            return new Promise((resolve, reject) => resolve(data));
        }
        Save(storeName, data) {
            let rawData = jQuery.map(data, value => value);
            let json = JSON.stringify(rawData);
            window.localStorage.setItem(storeName, json);
            this.auditLogStore.Clear();
        }
        // Does nothing at the moment when using local storage.
        // TODO: This needs to append the entry to the running log, but we can
        // only do that by loading the entire AuditLog from local storage, appending the entry,
        // and saving it again, as the AuditLog gets cleared whenever a Save operation takes place.
        SaveAuditLog(logEntry) { }
    }
    exports.LocalStoragePersistence = LocalStoragePersistence;
});
//# sourceMappingURL=LocalStoragePersistence.js.map