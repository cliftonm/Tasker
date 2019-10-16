// Sort of works, I get "Cannot read property 'default' of undefined"
// import * as jQuery from "../lib/jquery"

// We lose intellisense doing this:
// const $ = jQuery;

// However, using $, we don't get intellisense, but using jQuery, we do.

// import { Greeter } from "./classes/Greeter"
import { TemplateBuilder } from "./classes/TemplateBuilder"
import { Store } from "./classes/Store"
import { StoreType } from "./enums/StoreType"
import { StoreManager } from "./classes/StoreManager"
import { Items } from "./interfaces/Items"

export class AppMain {
    private CreateHtmlTemplate(template: Items, storeManager: StoreManager, storeName: string) : TemplateBuilder {
        let builder = new TemplateBuilder();
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

    private SetStoreIndex(html: string, idx: number): string {
        // a "replace all" function.
        let newHtml = html.split("{idx}").join(idx.toString());

        return newHtml;
    }

    public run() {
        let template = [     // Task Template
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
            { text: 'TODO'},
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

        let storeManager = new StoreManager();
        storeManager.AddInMemoryStore("StatusList", taskStates);
        let taskStore = storeManager.CreateStore("Tasks", StoreType.LocalStorage);

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

    private UpdateRecordView(builder: TemplateBuilder, store: Store, idx: number, record: {}): void {
        for (let j = 0; j < builder.elements.length; j++) {
            let tel = builder.elements[j];
            let guid = tel.guid.ToString();
            let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
            let val = record[tel.item.field];
            jel.val(val);
        }
    }

    private UpdatePropertyView(builder: TemplateBuilder, store: Store, idx: number, field: string, value: any): void {
        let tel = builder.elements.find(e => e.item.field == field);
        let guid = tel.guid.ToString();
        let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
        jel.val(value);
    }
};





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

