import { Guid } from "./Guid"
import { Store } from "./Store"
import { StoreManager } from "./StoreManager"
import { TemplateElement } from "./TemplateElement"
import { Item } from "../interfaces/Item"

export class TemplateBuilder
{
    html: string;
    elements: TemplateElement[] = [];
    templateContainerID: string;     // the #something tag name to identify the template container.

    constructor(templateContainerID : string)
    {
        this.html = "";
        this.templateContainerID = templateContainerID;
    }

    public DivBegin(item: Item) : TemplateBuilder {
        this.html += `<div style='float:left; width:${item.width}'>`;

        return this;
    }

    public DivEnd() : TemplateBuilder {
        this.html += "</div>";

        return this;
    }

    public TemplateDivBegin(): TemplateBuilder {
        this.html += `<div templateIdx='{idx}'>`;

        return this;
    }

    public TemplateDivEnd(): TemplateBuilder {
        this.html += "</div>";

        return this;
    }

    public DivClear() : TemplateBuilder {
        this.html += "<div style='clear:both'></div>";

        return this;
    }

    public Button(item: Item): TemplateBuilder {
        let guid = Guid.NewGuid();
        this.html += `<button type='button' style='width:100%' storeIdx='{idx}' bindGuid='${guid.ToString()}'>${item.text}</button>`;
        let el = new TemplateElement(item, guid);
        this.elements.push(el);

        return this;
    }

    public TextInput(item: Item) : TemplateBuilder {
        let placeholder = item.field;
        let guid = Guid.NewGuid();
        this.html += `<input type='text' placeholder='${placeholder}' style='width:100%' storeIdx='{idx}' bindGuid='${guid.ToString()}'>`;
        let el = new TemplateElement(item, guid);
        this.elements.push(el);

        return this;
    }

    public TextArea(item: Item): TemplateBuilder {
        let placeholder = item.field;
        let guid = Guid.NewGuid();
        this.html += `<textarea placeholder='${placeholder}' style='width:100%; height:${item.height}' storeIdx='{idx}' bindGuid='${guid.ToString()}'></textarea>`;
        let el = new TemplateElement(item, guid);
        this.elements.push(el);

        return this;
    }

    public Combobox(item: Item, storeManager: StoreManager) : TemplateBuilder {
        this.SelectBegin(item);

        storeManager.GetStoreData(item.storeName).forEach(kv => {
            this.Option(kv.text);
        });

        this.SelectEnd();

        return this;
    }

    public SelectBegin(item: Item) : TemplateBuilder {
        let guid = Guid.NewGuid();
        this.html += `<select style='width:100%; height:21px' storeIdx='{idx}' bindGuid='${guid.ToString()}'>`;
        let el = new TemplateElement(item, guid);
        this.elements.push(el);

        return this;
    }

    public SelectEnd() : TemplateBuilder {
        this.html += "</select>";

        return this;
    }

    public Option(text: string, value?: string) : TemplateBuilder {
        this.html += `<option value='${(value || text)}'>${text}</option>`;

        return this;
    }
}
