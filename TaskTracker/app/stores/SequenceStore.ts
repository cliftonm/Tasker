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

        n = this.GetProperty(recIdx, "count") + 1;
        this.SetProperty(recIdx, "count", n);
        this.Save();

        return n;
    }
}
