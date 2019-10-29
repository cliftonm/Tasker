import { RowRecordMap } from "../interfaces/RowRecordMap"
import { IStorePersistence } from "../interfaces/IStorePersistence"

export class CloudPersistence implements IStorePersistence {
    baseUrl: string;

    constructor(url: string) {
        this.baseUrl = url;
    }

    public async Load(storeName: string): Promise<RowRecordMap> {
        let records = await jQuery.ajax({ url: this.Url("Load") + `?StoreName=${storeName}` });
        let data = {};

        // Create indices that map records to a "key", in this case simply the initial row number.
        records.forEach((record, idx) => data[idx] = record);

        return data;
    }

    public Save(storeName: string, data: RowRecordMap): void {
        let rawData = jQuery.map(data, value => value);
        let json = JSON.stringify(rawData);
        jQuery.ajax({ url: this.Url("Save") + `?StoreName=${storeName}`, type: "POST", data: json });
    }

    public Update(storeName: string, data: RowRecordMap, record: {}, idx: number, property: string, value: string): void {
        jQuery.ajax({ url: this.Url("Update") + `?StoreName=${storeName}`, type: "POST", data: { idx: idx, property: property, value: value } });
    }

    private Url(path: string): string {
        return this.baseUrl + path;
    }
}
