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
import { ParentChildStore } from "./stores/ParentChildStore"
import { EventRouter } from "./classes/EventRouter"
import { Items } from "./interfaces/Items"
import { Relationship } from "./interfaces/Relationship"
import { SequenceStore } from "./stores/SequenceStore";

// Globals, implemented poorly for now:
var storeManager: StoreManager;
var eventRouter: EventRouter;
var parentChildRelationshipStore: ParentChildStore;

var relationships : Relationship[] = [
    {
        parent: "Tasks",
        children: ["Notes"]
    }
];

interface StoreTemplateBuilder {
    [storeName: string]: { builder: TemplateBuilder, template: string };
}

var builders: StoreTemplateBuilder = {};

export class AppMain {
    private CreateHtmlTemplate(templateContainerID: string, template: Items, storeManager: StoreManager, storeName: string): TemplateBuilder {
        let builder = new TemplateBuilder(templateContainerID);
        builders[storeName] = { builder, template: templateContainerID };
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

                case "textarea":
                    builder.TextArea(item);
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
        let taskTemplate = [
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
                route: "DeleteRecord",
            }
        ];

        let noteTemplate = [
            {
                field: "Note",
                line: 0,
                width: "80%",
                height: "100px",
                control: "textarea"
            },
            {
                text: "Delete",
                line: 0,
                width: "20%",
                control: "button",
                route: "DeleteRecord",
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

        storeManager = new StoreManager();

        let seqStore = new SequenceStore(storeManager, StoreType.LocalStorage, "Sequences");
        storeManager.RegisterStore(seqStore);
        seqStore.Load();
        storeManager.getPrimaryKeyCallback = (storeName: string) => {
            return { __ID: seqStore.GetNext(storeName) };
        }

        storeManager.AddInMemoryStore("StatusList", taskStates);
        parentChildRelationshipStore = new ParentChildStore(storeManager, StoreType.LocalStorage, "ParentChildRelationships");
        storeManager.RegisterStore(parentChildRelationshipStore);
        parentChildRelationshipStore.Load();

        let taskStore = storeManager.CreateStore("Tasks", StoreType.LocalStorage);
        let noteStore = storeManager.CreateStore("Notes", StoreType.LocalStorage);

        eventRouter = new EventRouter();
        eventRouter.AddRoute("DeleteRecord", (store, idx) => store.DeleteRecord(idx));
        eventRouter.AddRoute("CreateRecord", (store, idx) => store.CreateRecord(true));

        let taskBuilder = this.CreateHtmlTemplate("#taskTemplateContainer", taskTemplate, storeManager, taskStore.storeName);
        let noteBuilder = this.CreateHtmlTemplate("#noteTemplateContainer", noteTemplate, storeManager, noteStore.storeName);

        this.AssignStoreCallbacks(taskStore, taskBuilder);
        this.AssignStoreCallbacks(noteStore, noteBuilder);

        jQuery(document).ready(() => {
            jQuery("#createTask").on('click', () => {
                let idx = eventRouter.Route("CreateRecord", taskStore, 0);   // insert at position 0
                taskStore.SetDefault(idx, "Status", taskStates[0].text);
                taskStore.Save();
            });

            jQuery("#createTaskNote").on('click', () => {
                let idx = eventRouter.Route("CreateRecord", noteStore, 0);   // insert at position 0
                parentChildRelationshipStore.AddRelationship(taskStore, noteStore, idx);
                noteStore.Save();
            });

            this.BindElementEvents(taskBuilder, _ => true);
        });

        taskStore.Load();
        noteStore.Load(false);
        /*
            .SetDefault(0, "Status", taskStates[0].text)
            .SetDefault(1, "Status", taskStates[0].text)
            .SetDefault(2, "Status", taskStates[0].text)
            .Save();
        */

        // taskStore.SetProperty(1, "Task", `Random Task #${Math.floor(Math.random() * 100)}`);
    }

    private AssignStoreCallbacks(store: Store, builder: TemplateBuilder): void {
        store.recordCreatedCallback = (idx, record, insert, store) => this.CreateRecordView(builder, store, idx, record, insert);
        store.propertyChangedCallback = (idx, field, value, store) => this.UpdatePropertyView(builder, store, idx, field, value);
        store.recordDeletedCallback = (idx, store) => {
            this.DeleteRecordView(builder, idx);
            store.Save();
        }
    }

    private CreateRecordView(builder: TemplateBuilder, store: Store, idx: number, record: {}, insert: boolean): void {
        let html = builder.html;
        let template = this.SetStoreIndex(html, idx);

        if (insert) {
            jQuery(builder.templateContainerID).prepend(template);
        } else {
            jQuery(builder.templateContainerID).append(template);
        }

        this.BindElementEvents(builder, recIdx => recIdx == idx);

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

    private DeleteRecordView(builder: TemplateBuilder, idx: number): void {
        let path = `${builder.templateContainerID} > [templateIdx='${idx}']`;
        jQuery(path).remove();
    }

    private DeleteAllRecordsView(builder: TemplateBuilder) : void {
        let path = `${builder.templateContainerID}`;
        jQuery(path).children().remove();
    }

    private BindElementEvents(builder: TemplateBuilder, onCondition: (recIdx: number) => boolean) : void {
        builder.elements.forEach(el => {
            let guid = el.guid.ToString();
            let jels = jQuery(`[bindGuid = '${guid}']`);
            let assocStoreName = el.item.associatedStoreName;
            let store = storeManager.GetStore(assocStoreName);

            jels.each((_, elx) => {
                let jel = jQuery(elx);
                let recIdx = Number(jel.attr("storeIdx"));

                if (onCondition(recIdx)) {
                    jel.on('focus', () => {
                        if (store.selectedRecordIndex != recIdx) {
                            this.RecordSelected(builder, recIdx);
                            store.selectedRecordIndex = recIdx;
                            this.ShowChildRecords(store, recIdx, relationships);
                        }
                    });

                    switch (el.item.control) {
                        case "button":
                            jel.on('click', () => {
                                console.log(`click for ${guid} at index ${recIdx}`);
                                eventRouter.Route(el.item.route, store, recIdx);
                            });
                            break;

                        case "textarea":
                        case "textbox":
                        case "combobox":
                            jel.on('change', () => {
                                let field = el.item.field;
                                let val = jel.val();
                                console.log(`change for ${el.guid.ToString()} at index ${recIdx} with new value of ${jel.val()}`);
                                storeManager.GetStore(el.item.associatedStoreName).SetProperty(recIdx, field, val).UpdatePhysicalStorage(recIdx, field, val);
                            });
                            break;
                    }
                }
            });
        });
    }

    private RecordSelected(builder: TemplateBuilder, recIdx: number): void {
        jQuery(builder.templateContainerID).children().removeClass("recordSelected");
        let path = `${builder.templateContainerID} > [templateIdx='${recIdx}']`;
        jQuery(path).addClass("recordSelected");
    }

    private ShowChildRecords(parentStore: Store, parentRecIdx: number, relationships: Relationship[]): void {
        let parentStoreName = parentStore.storeName;
        let parentId = parentStore.GetProperty(parentRecIdx, "__ID");
        let relArray = relationships.filter(r => r.parent == parentStoreName);

        // Only one record for the parent type should exist.
        if (relArray.length == 1) {
            let rel = relArray[0];

            rel.children.forEach(child => {
                let builder = builders[child].builder;
                this.DeleteAllRecordsView(builder);
                let childRecs = parentChildRelationshipStore.GetChildInfo(parentStoreName, parentId, child);
                let childStore = childRecs.store;

                childRecs.childrenIndices.map(idx => Number(idx)).forEach(recIdx => {
                    let rec = childStore.GetRecord(recIdx);
                    this.CreateRecordView(builder, childStore, recIdx, rec, false);
                });
            });
        }
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

