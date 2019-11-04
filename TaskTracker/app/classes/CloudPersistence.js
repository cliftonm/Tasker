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
        constructor(url, userId) {
            this.baseUrl = url;
            this.userId = userId;
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
            let json = JSON.stringify(rawData);
            jQuery.post(this.Url("Save") + this.AddParams({ UserId: this.userId.ToString() }), JSON.stringify({ auditLog: json }));
            this.auditLogStore.Clear();
        }
        // Does nothing when using cloud persistence as we don't need to load the audit log.
        LoadAuditLog() { }
        // Only the log entry is posted to the server.  The entire log is NOT sent!
        SaveAuditLog(logEntry) {
            let json = JSON.stringify(logEntry);
            jQuery.post(this.Url("SaveLogEntry") + this.AddParams({ UserId: this.userId.ToString() }), json);
        }
        Url(path) {
            return this.baseUrl + path;
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