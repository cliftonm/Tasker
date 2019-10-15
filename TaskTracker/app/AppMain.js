// Sort of works, I get "Cannot read property 'default' of undefined"
// import * as jQuery from "../lib/jquery"
define(["require", "exports", "./classes/TemplateBuilder", "./classes/Store", "./enums/StoreType"], function (require, exports, TemplateBuilder_1, Store_1, StoreType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppMain {
        CreateHtmlTemplate(template, store, entityStore) {
            let builder = new TemplateBuilder_1.TemplateBuilder();
            let line = -1;
            let firstLine = true;
            template.forEach(item => {
                if (item.line != line) {
                    line = item.line;
                    if (!firstLine) {
                        builder.DivClear();
                    }
                    firstLine = false;
                }
                builder.DivBegin(item);
                switch (item.control) {
                    case "textbox":
                        builder.TextInput(item, entityStore);
                        break;
                    case "combobox":
                        builder.Combobox(item, store, entityStore);
                        break;
                }
                builder.DivEnd();
            });
            builder.DivClear();
            return builder.html;
        }
        SetStoreIndex(html, idx) {
            // a "replace all" function.
            let newHtml = html.split("{idx}").join(idx.toString());
            return newHtml;
        }
        run() {
            let template = [
                {
                    field: "Task",
                    line: 0,
                    width: "80%",
                    control: "textbox",
                },
                {
                    field: "Status",
                    storeName: "StatusList",
                    orderBy: "StatusOrder",
                    line: 0,
                    width: "20%",
                    control: "combobox",
                },
                {
                    field: "Why",
                    line: 1,
                    width: "100%",
                    control: "textbox",
                }
            ];
            let taskStates = [
                { text: 'TODO' },
                { text: 'Working On' },
                { text: 'Testing' },
                { text: 'QA' },
                { text: 'Done' },
                { text: 'On Production' },
                { text: 'Waiting on 3rd Party' },
                { text: 'Waiting on Coworker' },
                { text: 'Waiting on Management' },
                { text: 'Stuck' },
            ];
            let store = new Store_1.Store();
            store.AddInMemoryStore("StatusList", taskStates);
            let entityStore = store.CreateStore("Tasks", StoreType_1.StoreType.LocalStorage);
            let html = this.CreateHtmlTemplate(template, store, entityStore);
            let task1 = this.SetStoreIndex(html, 0);
            let task2 = this.SetStoreIndex(html, 1);
            let task3 = this.SetStoreIndex(html, 2);
            jQuery("#template").html(task1 + task2 + task3);
            /*
            let greeter = new Greeter();
            greeter.greet();
    
            // This works:
            // jQuery(document).ready(($) => {
            $(document).ready(() => {
                $('#inputbox').val('Fizbin');
            });
            */
            // This doesn't:
            // $(document).ready(() => {
            // unless we do:
            // const $ = jQuery;
            // and we have:
            // <script type="text/javascript" src="lib/jquery.js"></script>
            // in index.html
        }
    }
    exports.AppMain = AppMain;
    ;
});
//# sourceMappingURL=AppMain.js.map