define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Helpers {
        static ReplaceAll(str, orig, repl) {
            return str.split(orig).join(repl);
        }
    }
    exports.Helpers = Helpers;
});
//# sourceMappingURL=Helpers.js.map