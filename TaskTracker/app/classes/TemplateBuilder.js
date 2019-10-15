define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TemplateBuilder {
        constructor() {
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
        TextInput(item, entityStore) {
            let placeholder = item.field;
            this.html += "<input type='text' placeholder='" + placeholder + "' style='width:100%' storeIdx='{idx}'>";
            return this;
        }
        Combobox(item, store, entityStore) {
            this.SelectBegin();
            store.GetStoreData(item.storeName).forEach(kv => {
                this.Option(kv.text);
            });
            this.SelectEnd();
            return this;
        }
        SelectBegin() {
            this.html += "<select style='width:100%; height:21px' storeIdx='{idx}'>";
            return this;
        }
        SelectEnd() {
            this.html += "</select>";
            return this;
        }
        Option(text, value) {
            this.html += "<option value='" + value + "'>" + text + "</option>";
            return this;
        }
    }
    exports.TemplateBuilder = TemplateBuilder;
});
//# sourceMappingURL=TemplateBuilder.js.map