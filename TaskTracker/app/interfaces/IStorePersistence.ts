import { RowRecordMap } from "./RowRecordMap"

export interface IStorePersistence {
    Load(storeName: string): RowRecordMap;
    Save(storeName: string, data: RowRecordMap): void;
    Update(storeName: string, data: RowRecordMap, record: {}, idx: number, property: string, value: string): void;
}