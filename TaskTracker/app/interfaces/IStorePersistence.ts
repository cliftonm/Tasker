import { RowRecordMap } from "./RowRecordMap"
import { AuditLogStore } from "../stores/AuditLogStore"

export interface IStorePersistence {
    Load(storeName: string): Promise<RowRecordMap>;
    Save(storeName: string, data: RowRecordMap): void;
    SetAuditLogStore(auditLogStore: AuditLogStore): void;
}
