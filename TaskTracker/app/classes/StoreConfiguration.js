define(["require", "exports", "../enums/StoreType"], function (require, exports, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StoreConfiguration {
        constructor() {
            this.storeType = StoreType_1.StoreType.Undefined;
            this.data = [];
        }
        SetProperty(idx, property, value) {
            // Create additional records as necessary:
            while (this.data.length - 1 < idx) {
                this.data.push({});
            }
            this.data[idx][property] = value;
            this.UpdatePhysicalStorage(this.data[idx], property, value);
            return this;
        }
        UpdatePhysicalStorage(record, property, value) {
            switch (this.storeType) {
                case StoreType_1.StoreType.InMemory:
                    // Do nothing.
                    break;
                case StoreType_1.StoreType.RestCall:
                    // Eventually send an update but we probably ought to have a PK with which to associate the change.
                    break;
                case StoreType_1.StoreType.LocalStorage:
                    // Here we just update the whole structure.
                    let json = JSON.stringify(this.data);
                    window.localStorage.setItem("Tasks", json);
                    break;
            }
        }
    }
    exports.StoreConfiguration = StoreConfiguration;
});
//# sourceMappingURL=StoreConfiguration.js.map