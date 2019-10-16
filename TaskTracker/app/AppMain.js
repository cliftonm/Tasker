// Sort of works, I get "Cannot read property 'default' of undefined"
// import * as jQuery from "../lib/jquery"
define(["require", "exports", "./classes/TemplateBuilder", "./enums/StoreType", "./classes/StoreManager"], function (require, exports, TemplateBuilder_1, StoreType_1, StoreManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppMain {
        CreateHtmlTemplate(template, storeManager, storeName) {
            let builder = new TemplateBuilder_1.TemplateBuilder();
            let line = -1;
            let firstLine = true;
            builder.TemplateDivBegin();
            template.forEach(item => {
                // Set the store to which the item is associated so we can update the property value for the correct
                // store record when the UI changes or a button is clicked.
                item.associatedStoreName = storeName;
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
                        builder.TextInput(item);
                        break;
                    case "combobox":
                        builder.Combobox(item, storeManager);
                        break;
                    case "button":
                        builder.Button(item);
                        break;
                }
                builder.DivEnd();
            });
            builder.DivClear();
            builder.TemplateDivEnd();
            return builder;
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
                    width: "80%",
                    control: "textbox",
                },
                {
                    text: "Delete",
                    line: 1,
                    width: "20%",
                    control: "button",
                    route: "deleteRecord",
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
            let storeManager = new StoreManager_1.StoreManager();
            storeManager.AddInMemoryStore("StatusList", taskStates);
            let taskStore = storeManager.CreateStore("Tasks", StoreType_1.StoreType.LocalStorage);
            let builder = this.CreateHtmlTemplate(template, storeManager, taskStore.storeName);
            let html = builder.html;
            let task1 = this.SetStoreIndex(html, 0);
            let task2 = this.SetStoreIndex(html, 1);
            let task3 = this.SetStoreIndex(html, 2);
            jQuery("#template").html(task1 + task2 + task3);
            taskStore.recordChangedCallback = (idx, record, store) => this.UpdateRecordView(builder, store, idx, record);
            taskStore.propertyChangedCallback = (idx, field, value, store) => this.UpdatePropertyView(builder, store, idx, field, value);
            jQuery(document).ready(() => {
                // Bind the onchange events.
                builder.elements.forEach(el => {
                    let guid = el.guid.ToString();
                    let jels = jQuery(`[bindGuid = '${guid}']`);
                    jels.each((_, elx) => {
                        let jel = jQuery(elx);
                        switch (el.item.control) {
                            case "button":
                                jel.on('click', () => {
                                    let recIdx = Number(jel.attr("storeIdx"));
                                    console.log(`click for ${el.guid.ToString()} at index ${recIdx}`);
                                });
                                break;
                            case "textbox":
                            case "combobox":
                                jel.on('change', () => {
                                    let recIdx = Number(jel.attr("storeIdx"));
                                    let field = el.item.field;
                                    let val = jel.val();
                                    console.log(`change for ${el.guid.ToString()} at index ${recIdx} with new value of ${jel.val()}`);
                                    storeManager.GetStore(el.item.associatedStoreName).SetProperty(recIdx, field, val).UpdatePhysicalStorage(recIdx, field, val);
                                });
                                break;
                        }
                    });
                });
            });
            taskStore.Load()
                .SetDefault(0, "Status", taskStates[0].text)
                .SetDefault(1, "Status", taskStates[0].text)
                .SetDefault(2, "Status", taskStates[0].text)
                .Save();
            taskStore.SetProperty(1, "Task", `Random Task #${Math.floor(Math.random() * 100)}`);
        }
        UpdateRecordView(builder, store, idx, record) {
            for (let j = 0; j < builder.elements.length; j++) {
                let tel = builder.elements[j];
                let guid = tel.guid.ToString();
                let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
                let val = record[tel.item.field];
                jel.val(val);
            }
        }
        UpdatePropertyView(builder, store, idx, field, value) {
            let tel = builder.elements.find(e => e.item.field == field);
            let guid = tel.guid.ToString();
            let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
            jel.val(value);
        }
    }
    exports.AppMain = AppMain;
    ;
});
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
//# sourceMappingURL=AppMain.js.map