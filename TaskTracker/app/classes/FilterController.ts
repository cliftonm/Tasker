import { Filterable } from "../interfaces/Filterable"
import { IFilterables } from "../interfaces/IFilterables"
import { StoreManager } from "./StoreManager"

export class FilterController {
    storeManager: StoreManager;

    public CreateView(storeManager: StoreManager, containerID: string, filterables: IFilterables): void {
        let html: string = "";
        this.storeManager = storeManager;

        filterables.forEach(filter => {
            html += this.CreateFilterOptions(filter);
        });

        jQuery(containerID).append(html);
    }

    private CreateFilterOptions(filter: Filterable): string {
        let html: string = "";
        html += `<div style='float:left;' class='filterableItem'>`;
        let classStyle = "tblabelleft";
        html += `<div><span ${classStyle};'>${filter.name}</span></div>`;
        html += this.CreateOptionList(filter.template.filter(item => item.field == filter.field)[0].storeName);
        html += "</div>";

        return html;
    }

    private CreateOptionList(storeName: string): string {
        let data = this.storeManager.GetStoreData(storeName);
        let html = "";
        let ckid = 0;

        data.forEach(d => {
            let filtering = d.filtering ? "checked" : "";
            html += "<div>";
            html += `<input type='checkbox' name='${ckid}' ${filtering}>`;
            html += `<label for= '${ckid}'>${d.text}</label>`;
            html += "</div>";
            ckid += 1;
        });

        return html;
    }
}