import { RowRecordMap } from "../interfaces/RowRecordMap"
import { IStorePersistence } from "../interfaces/IStorePersistence"

export class LocalStoragePersistence implements IStorePersistence {
    public Load(storeName: string): Promise<RowRecordMap> {
        let json = window.localStorage.getItem(storeName);
        let data = {};

        if (json) {
            try {
                // Create indices that map records to a "key", in this case simply the initial row number.
                let records: {}[] = JSON.parse(json);
                records.forEach((record, idx) => data[idx] = record);
            } catch (ex) {
                console.log(ex);
                // Storage is corrupt, eek, we're going to remove it!
                window.localStorage.removeItem(storeName);
            }
        }

        return new Promise((resolve, reject) => resolve(data));
    }

    public Save(storeName: string, data: RowRecordMap): void {
        let rawData = jQuery.map(data, value => value);
        let json = JSON.stringify(rawData);
        window.localStorage.setItem(storeName, json);
    }

    public Update(storeName: string, data:RowRecordMap, record: {}, idx: number, property: string, value: string) : void {
        this.Save(storeName, data);
    }
}
