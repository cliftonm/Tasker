define(["require", "exports", "../classes/Store"], function (require, exports, Store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SequenceStore extends Store_1.Store {
        GetNext(skey) {
            let n = 0;
            let recIdx = this.FindRecordOfType(r => r.key == skey);
            if (recIdx == -1) {
                recIdx = this.CreateRecord();
                this.SetProperty(recIdx, "key", skey);
                this.SetProperty(recIdx, "count", 0);
            }
            n = this.GetProperty(recIdx, "count") + 1;
            this.SetProperty(recIdx, "count", n);
            this.Save();
            return n;
        }
    }
    exports.SequenceStore = SequenceStore;
});
//# sourceMappingURL=SequenceStore.js.map