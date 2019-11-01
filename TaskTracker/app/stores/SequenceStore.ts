import { Store } from "../classes/Store"
import { SequenceModel } from "../models/SequenceModel"

export class SequenceStore extends Store {
    GetNext(skey: string): number {
        let n = 0;
        let recIdx = this.FindRecordOfType<SequenceModel>(r => r.key == skey);

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
    protected GetNextPrimaryKey(): {} {
        let id = Object.keys(this.data).length;
        return { __ID: id };
    }
}
