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
            // Number because this field is being created in the DB as an nvarchar since we don't have field types yet!
            n = Number(this.GetProperty(recIdx, "count")) + 1;
            this.SetProperty(recIdx, "count", n);
            this.Save();
            return n;
        }
        // Sequence store has to override this function so that we don't recursively call GetNext
        // when CreateRecord is called above.  We need __ID so the server knows what record to operate on.
        GetNextPrimaryKey() {
            let id = Object.keys(this.data).length;
            return { __ID: id };
        }
    }
    exports.SequenceStore = SequenceStore;
});
//# sourceMappingURL=SequenceStore.js.map