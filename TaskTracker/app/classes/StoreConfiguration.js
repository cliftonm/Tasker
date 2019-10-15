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
            return this;
        }
    }
    exports.StoreConfiguration = StoreConfiguration;
});
//# sourceMappingURL=StoreConfiguration.js.map