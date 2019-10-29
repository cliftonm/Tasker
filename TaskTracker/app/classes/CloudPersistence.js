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
        constructor(url) {
            this.baseUrl = url;
        }
        Load(storeName) {
            return __awaiter(this, void 0, void 0, function* () {
                let records = yield jQuery.ajax({ url: this.Url("Load") + `?StoreName=${storeName}` });
                let data = {};
                // Create indices that map records to a "key", in this case simply the initial row number.
                records.forEach((record, idx) => data[idx] = record);
                return data;
            });
        }
        Save(storeName, data) {
            let rawData = jQuery.map(data, value => value);
            let json = JSON.stringify(rawData);
            window.localStorage.setItem(storeName, json);
        }
        Update(storeName, data, record, idx, property, value) {
            this.Save(storeName, data);
        }
        Url(path) {
            return this.baseUrl + path;
        }
    }
    exports.CloudPersistence = CloudPersistence;
});
//# sourceMappingURL=CloudPersistence.js.map