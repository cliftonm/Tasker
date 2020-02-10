define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FilterController {
        CreateView(storeManager, containerID, filterables) {
            let html = "";
            this.storeManager = storeManager;
            filterables.forEach(filter => {
                html += this.CreateFilterOptions(filter);
            });
            jQuery(containerID).append(html);
        }
        CreateFilterOptions(filter) {
            let html = "";
            html += `<div style='float:left;' class='filterableItem'>`;
            let classStyle = "tblabelleft";
            html += `<div><span ${classStyle};'>${filter.name}</span></div>`;
            html += this.CreateOptionList(filter.template.filter(item => item.field == filter.field)[0].storeName);
            html += "</div>";
            return html;
        }
        CreateOptionList(storeName) {
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
    exports.FilterController = FilterController;
});
//# sourceMappingURL=FilterController.js.map