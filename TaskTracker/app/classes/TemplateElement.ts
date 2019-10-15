import { Item } from "../interfaces/Item"
import { Guid } from "./Guid"

export class TemplateElement {
    item: Item;
    guid: Guid;

    constructor(item: Item, guid: Guid) {
        this.item = item;
        this.guid = guid;
    }
}