define(["require", "exports", "./Guid", "./TemplateElement"], function (require, exports, Guid_1, TemplateElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TemplateBuilder {
        constructor() {
            this.elements = [];
            this.html = "";
        }
        DivBegin(item) {
            this.html += "<div style='float:left; width:" + item.width + "'>";
            return this;
        }
        DivEnd() {
            this.html += "</div>";
            return this;
        }
        DivClear() {
            this.html += "<div style='clear:both'></div>";
            return this;
        }
        TextInput(item) {
            let placeholder = item.field;
            let guid = Guid_1.Guid.NewGuid();
            this.html += "<input type='text' placeholder='" + placeholder + "' style='width:100%' storeIdx='{idx}' bindGuid='" + guid.ToString() + "'>";
            let el = new TemplateElement_1.TemplateElement(item, guid);
            this.elements.push(el);
            return this;
        }
        Combobox(item, store) {
            this.SelectBegin(item);
            store.GetStoreData(item.storeName).forEach(kv => {
                this.Option(kv.text);
            });
            this.SelectEnd();
            return this;
        }
        SelectBegin(item) {
            let guid = Guid_1.Guid.NewGuid();
            this.html += "<select style='width:100%; height:21px' storeIdx='{idx}' bindGuid='" + guid.ToString() + "'>";
            let el = new TemplateElement_1.TemplateElement(item, guid);
            this.elements.push(el);
            return this;
        }
        SelectEnd() {
            this.html += "</select>";
            return this;
        }
        Option(text, value) {
            this.html += "<option value='" + (value || text) + "'>" + text + "</option>";
            return this;
        }
    }
    exports.TemplateBuilder = TemplateBuilder;
});
//# sourceMappingURL=TemplateBuilder.js.map