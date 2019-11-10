import { AuditLogAction } from "../enums/AuditLogAction"

export class AuditLogModel {
    storeName: string;
    action: AuditLogAction;
    recordIndex: number;
    property: string;
    value: any;

    constructor(storeName: string, action: AuditLogAction, recordIndex: number, property: string, value: any) {
        this.storeName = storeName;
        this.action = action;
        this.recordIndex = recordIndex;
        this.property = property;
        this.value = value;
    }
}
