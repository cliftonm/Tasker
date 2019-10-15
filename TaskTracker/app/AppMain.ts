// Sort of works, I get "Cannot read property 'default' of undefined"
// import * as jQuery from "../lib/jquery"

// We lose intellisense doing this:
// const $ = jQuery;

// However, using $, we don't get intellisense, but using jQuery, we do.

// import { Greeter } from "./classes/Greeter"
import { TemplateBuilder } from "./classes/TemplateBuilder"
import { Store } from "./classes/Store"
import { StoreType } from "./enums/StoreType"
import { StoreConfiguration } from "./classes/StoreConfiguration"
import { Items } from "./interfaces/Items"

export class AppMain {
    private CreateHtmlTemplate(template: Items, store: Store, entityStore: StoreConfiguration) : string {
        let builder = new TemplateBuilder();
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
                width: "100%",
                control: "textbox",
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

        let store = new Store();
        store.AddInMemoryStore("StatusList", taskStates);
        let entityStore = store.CreateStore("Tasks", StoreType.LocalStorage);

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
};
