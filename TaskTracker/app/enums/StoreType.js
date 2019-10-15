define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var StoreType;
    (function (StoreType) {
        StoreType[StoreType["Undefined"] = 0] = "Undefined";
        StoreType[StoreType["InMemory"] = 1] = "InMemory";
        StoreType[StoreType["LocalStorage"] = 2] = "LocalStorage";
        StoreType[StoreType["RestCall"] = 3] = "RestCall";
    })(StoreType = exports.StoreType || (exports.StoreType = {}));
});
//# sourceMappingURL=StoreType.js.map