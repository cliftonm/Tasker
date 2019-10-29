import { RowRecordMap } from "./RowRecordMap"

export interface IStorePersistence {
    Load(storeName: string): Promise<RowRecordMap>;
    Save(storeName: string, data: RowRecordMap): void;
    Update(storeName: string, data: RowRecordMap, record: {}, idx: number, property: string, value: string): void;
}
