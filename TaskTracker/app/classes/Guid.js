define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Guid {
        constructor(guid) {
            this.guid = guid;
        }
        static get Zero() { return new Guid("00000000-0000-0000-0000-000000000000"); }
        ToString() {
            return this.guid;
        }
        static NewGuid() {
            var result;
            var i;
            var j;
            result = "";
            for (j = 0; j < 32; j++) {
                if (j == 8 || j == 12 || j == 16 || j == 20) {
                    result = result + '-';
                }
                i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
                result = result + i;
            }
            return new Guid(result);
        }
    }
    exports.Guid = Guid;
});
//# sourceMappingURL=Guid.js.map