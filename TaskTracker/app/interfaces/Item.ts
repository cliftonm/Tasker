export interface Item {
    line: number;
    width: string;
    control: string;
    style?: string;
    height?: string;
    text?: string;
    field?: string;
    storeName?: string;                 // for list of things like used for comboboxes
    orderBy?: string;
    route?: string;
    // associatedStoreName?: string;       // the store to which the item's property:value is associated.
}


