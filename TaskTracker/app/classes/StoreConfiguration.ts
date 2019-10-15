import { StoreType } from "../enums/StoreType"

export class StoreConfiguration {
    storeType: StoreType;
    cached: boolean;
    data: any;

    constructor() {
        this.storeType = StoreType.Undefined;
        this.data = [];
    }

    public SetProperty(idx: number, property: string, value: any): StoreConfiguration {
        // Create additional records as necessary:
        while (this.data.length - 1 < idx) {
            this.data.push({});
        }

        this.data[idx][property] = value;

        return this;
    }
}

