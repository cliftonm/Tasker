import { RowRecordMap } from "./RowRecordMap"
import { AuditLogStore } from "../stores/AuditLogStore"
import { AuditLogModel } from "../models/AuditLogModel";

export interface IStorePersistence {
    Load(storeName: string): Promise<RowRecordMap>;
    Save(storeName: string, data: RowRecordMap): void;
    LoadAuditLog(): void;
    SaveAuditLog(logEntry: AuditLogModel): void;
    SetAuditLogStore(auditLogStore: AuditLogStore): void;
}
