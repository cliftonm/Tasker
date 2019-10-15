import { Store } from "./Store"
import { StoreConfiguration } from "./StoreConfiguration"
import { Item } from "../interfaces/Item"

export class TemplateBuilder
{
    html: string;

    constructor()
    {
        this.html = "";
    }

    public DivBegin(item: Item) : TemplateBuilder {
        this.html += "<div style='float:left; width:" + item.width + "'>";

        return this;
    }

    public DivEnd() : TemplateBuilder {
        this.html += "</div>";

        return this;
    }

    public DivClear() : TemplateBuilder {
        this.html += "<div style='clear:both'></div>";

        return this;
    }

    public TextInput(item: Item, entityStore: StoreConfiguration) : TemplateBuilder {
        let placeholder = item.field;
        this.html += "<input type='text' placeholder='" + placeholder + "' style='width:100%' storeIdx='{idx}'>";

        return this;
    }

    public Combobox(item: Item, store: Store, entityStore: StoreConfiguration) : TemplateBuilder {
        this.SelectBegin();

        store.GetStoreData(item.storeName).forEach(kv => {
            this.Option(kv.text);
        });

        this.SelectEnd();

        return this;
    }

    public SelectBegin() : TemplateBuilder {
        this.html += "<select style='width:100%; height:21px' storeIdx='{idx}'>";

        return this;
    }

    public SelectEnd() : TemplateBuilder {
        this.html += "</select>";

        return this;
    }

    public Option(text: string, value?: string) : TemplateBuilder {
        this.html += "<option value='" + value + "'>" + text + "</option>";

        return this;
    }
}
