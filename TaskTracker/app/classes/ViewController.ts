import { TemplateBuilder } from "./TemplateBuilder"
import { TemplateElement } from "./TemplateElement"
import { Store } from "./Store"
import { StoreType } from "../enums/StoreType"
import { StoreManager } from "./StoreManager"
import { ParentChildStore } from "../stores/ParentChildStore"
import { Items } from "../interfaces/Items"
import { Relationship } from "../interfaces/Relationship"
import { EventRouter } from "./EventRouter"

export class ViewController {
    storeManager: StoreManager;
    parentChildRelationshipStore: ParentChildStore;
    builder: TemplateBuilder;
    eventRouter: EventRouter;
    store: Store;
    childControllers: ViewController[] = [];

    ready: boolean = false;

    relationships: Relationship[] = [
        {
            parent: "Projects",
            children: ["Tasks", "Contacts", "Links", "Notes"]
        },
        {
            parent: "Tasks",
            children: ["Links", "Notes"]
        }
    ];

    constructor(storeManager: StoreManager, parentChildRelationshipStore: ParentChildStore, eventRouter: EventRouter) {
        this.storeManager = storeManager;
        this.parentChildRelationshipStore = parentChildRelationshipStore;
        this.eventRouter = eventRouter;
    }

    public CreateStoreViewFromTemplate(
        storeName: string,
        storeType: StoreType,
        containerName: string,
        template: Items,
        createButtonId: string,
        updateView: boolean = true,
        parentViewController: ViewController,
        createCallback: (idx: number, store: Store) => void = _ => { }
    ): Store {

        // ?. operator.  
        // Supposedly TypeScript 3.7 has it, but I can't select that version in VS2017.  VS2019?
        let builder = this.CreateHtmlTemplate(containerName, template, storeName);

        if (parentViewController) {
            parentViewController.RegisterChildController(this);
        }

        if (this.storeManager.HasStore(storeName)) {
            this.store = this.storeManager.GetStore(storeName);
        } else {
            this.store = this.storeManager.CreateStore(storeName, storeType);
            this.AssignStoreCallbacks(this.store);
        }

        jQuery(document).ready(() => {
            console.log(`store: ${storeName}  updateView: ${updateView}`);
            if (updateView) {
                // All elements loaded so there's no qualifier as to which element we get events on.
                this.BindElementEvents(builder, _ => true);
            }

            jQuery(createButtonId).on('click', () => {
                let idx = this.eventRouter.Route("CreateRecord", this.store, 0, builder);   // insert at position 0
                createCallback(idx, this.store);

                if (parentViewController) {
                    this.parentChildRelationshipStore.AddRelationship(parentViewController.store, this.store, idx);
                }

                this.store.Save();
            });
        });

        this.store.Load(updateView, builder);

        return this.store;
    }

    private RegisterChildController(childViewController: ViewController): void {
        this.childControllers.push(childViewController)
    }

    private CreateHtmlTemplate(templateContainerID: string, template: Items, storeName: string): TemplateBuilder {
        this.builder = new TemplateBuilder(templateContainerID);
        let line = -1;
        let firstLine = true;

        this.builder.TemplateDivBegin();

        template.forEach(item => {
            // Set the store to which the item is associated so we can update the property value for the correct
            // store record when the UI changes or a button is clicked.
            item.associatedStoreName = storeName;

            if (item.line != line) {
                line = item.line;

                if (!firstLine) {
                    this.builder.DivClear();
                }

                firstLine = false;
            }

            this.builder.DivBegin(item);

            switch (item.control) {
                case "textbox":
                    this.builder.TextInput(item);
                    break;

                case "textarea":
                    this.builder.TextArea(item);
                    break;

                case "combobox":
                    this.builder.Combobox(item, this.storeManager);
                    break;

                case "button":
                    this.builder.Button(item);
                    break;
            }

            this.builder.DivEnd();
        });

        this.builder.DivClear();
        this.builder.TemplateDivEnd();

        return this.builder;
    }

    private RecordSelected(builder: TemplateBuilder, recIdx: number): void {
        jQuery(builder.templateContainerID).children().removeClass("recordSelected");
        let path = `${builder.templateContainerID} > [templateIdx='${recIdx}']`;
        jQuery(path).addClass("recordSelected");
    }

    private ShowChildRecords(parentStore: Store, parentRecIdx: number): void {
        let parentStoreName = parentStore.storeName;
        let parentId = parentStore.GetProperty(parentRecIdx, "__ID");
        let relArray = this.relationships.filter(r => r.parent == parentStoreName);

        // Only one record for the parent type should exist.
        if (relArray.length == 1) {
            let rel = relArray[0];

            rel.children.forEach(child => {
                let childRecs = this.parentChildRelationshipStore.GetChildInfo(parentStoreName, parentId, child);
                let childStore = childRecs.store;

                childRecs.childrenIndices.map(idx => Number(idx)).forEach(recIdx => {
                    let builder = this.childControllers.find(c => c.store.storeName == child).builder;
                    console.log(`Store: ${this.store.storeName}  Child Store: ${childRecs.store.storeName}   parent:${parentStoreName}   child:${child}`);
                    console.log(`Creating template view: ${builder.templateContainerID} > [recIdx='${recIdx}']`);
                    this.CreateRecordView(builder, childStore, recIdx, false);
                });
            });
        }
    }

    // Recursively remove all child view records.
    private RemoveChildRecordsView(store: Store, recIdx: number): void {
        let storeName = store.storeName;
        let id = store.GetProperty(recIdx, "__ID");
        let rels = this.relationships.filter(r => r.parent == storeName);

        if (rels.length == 1) {
            let childEntities = rels[0].children;

            childEntities.forEach(childEntity => {
                if (this.storeManager.HasStore(childEntity)) {
                    var info = this.parentChildRelationshipStore.GetChildInfo(storeName, id, childEntity);
                    info.childrenIndices.forEach(childRecIdx => {
                        let builder = this.childControllers.find(c => c.store.storeName == childEntity).builder;
                        this.DeleteRecordView(builder, childRecIdx);
                        this.RemoveChildRecordsView(this.storeManager.GetStore(childEntity), childRecIdx);
                    });
                }
            });
        }
    }

    private AssignStoreCallbacks(store: Store): void {
        store.recordCreatedCallback = (idx, record, insert, store, builder) => {
            this.CreateRecordView(builder, store, idx, insert);
            this.FocusOnFirstField(builder, idx);
        };
        store.propertyChangedCallback = (idx, field, value, store, builder) => this.UpdatePropertyView(builder, store, idx, field, value);
        store.recordDeletedCallback = (idx, store, builder) => {
            // Remove child template views before we start deleting relationships!
            this.RemoveChildRecordsView(store, idx);
            this.parentChildRelationshipStore.DeleteRelationship(store, idx);
            this.DeleteRecordView(builder, idx);
        }
    }

    private SetStoreIndex(html: string, idx: number): string {
        // a "replace all" function.
        let newHtml = html.split("{idx}").join(idx.toString());

        return newHtml;
    }

    private CreateRecordView(builder: TemplateBuilder, store: Store, idx: number, insert: boolean): void {
        let record = store.GetRecord(idx);
        let html = builder.html;
        let template = this.SetStoreIndex(html, idx);

        if (insert) {
            jQuery(builder.templateContainerID).prepend(template);
        } else {
            jQuery(builder.templateContainerID).append(template);
        }

        // Only wire up the events for the record we just created, the rest are wired up already.
        this.BindElementEvents(builder, recIdx => recIdx == idx);

        for (let j = 0; j < builder.elements.length; j++) {
            let tel = builder.elements[j];
            let guid = tel.guid.ToString();
            let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
            let val = record[tel.item.field];
            jel.val(val);

            // Hack!
            if (tel.item.control == "combobox") {
                this.SetComboboxColor(jel, val);
            }
        }
    }

    private FocusOnFirstField(builder: TemplateBuilder, idx: number) {
        let tel = builder.elements[0];
        let guid = tel.guid.ToString();
        jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`).focus();
    }

    private UpdatePropertyView(builder: TemplateBuilder, store: Store, idx: number, field: string, value: any): void {
        let tel = builder.elements.find(e => e.item.field == field);
        let guid = tel.guid.ToString();
        let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
        jel.val(value);
    }

    private DeleteRecordView(builder: TemplateBuilder, idx: number): void {
        // Not all stores have views.
        if (builder) {
            console.log(`Removing template view: ${builder.templateContainerID} > [templateIdx='${idx}']`);
            let path = `${builder.templateContainerID} > [templateIdx='${idx}']`;
            jQuery(path).remove();
        }
    }

    /*
    private DeleteAllRecordsView(builder: TemplateBuilder) : void {
        let path = `${builder.templateContainerID}`;
        jQuery(path).children().remove();
    }
    */

    private BindElementEvents(builder: TemplateBuilder, onCondition: (recIdx: number) => boolean): void {
        builder.elements.forEach(el => {
            let guid = el.guid.ToString();
            let jels = jQuery(`[bindGuid = '${guid}']`);
            let assocStoreName = el.item.associatedStoreName;
            let store = this.storeManager.GetStore(assocStoreName);
            let me = this;
            console.log(`>>> ready: ${me.ready}  store:${me.store.storeName}`);

            jels.each((_, elx) => {
                let jel = jQuery(elx);
                let recIdx = Number(jel.attr("storeIdx"));

                if (onCondition(recIdx)) {
                    jel.on('focus', () => {
                        console.log(`recIdx: ${recIdx}  ready: ${me.ready}  store:${me.store.storeName}`);

                        if (store.selectedRecordIndex != recIdx && this.ready) {
                            me.RemoveChildRecordsView(store, store.selectedRecordIndex);
                            me.RecordSelected(builder, recIdx);
                            store.selectedRecordIndex = recIdx;
                            me.ShowChildRecords(store, recIdx);
                        }
                    });

                    switch (el.item.control) {
                        case "button":
                            jel.on('click', () => {
                                console.log(`click for ${guid} at index ${recIdx}`);
                                this.eventRouter.Route(el.item.route, store, recIdx, builder);
                            });
                            break;

                        case "textarea":
                        case "textbox":
                            jel.on('change', () => {
                                this.SetPropertyValue(builder, jel, el, recIdx);
                            });
                            break;

                        case "combobox":
                            jel.on('change', () => {
                                // TODO: Move this very custom behavior out into a view handler
                                let val = this.SetPropertyValue(builder, jel, el, recIdx);
                                this.SetComboboxColor(jel, val);
                            });

                            // I can't find an event for when the option list is actually shown, so for now 
                            // we reset the background color on focus and restore it on lose focus.
                            jel.on('focus', () => {
                                jel.css("background-color", "white");
                            });

                            jel.on('blur', () => {
                                let val = jel.val();
                                this.SetComboboxColor(jel, val);
                            });
                            break;
                    }
                }
            });
        });
    }

    private SetPropertyValue(builder: TemplateBuilder, jel: JQuery, el: TemplateElement, recIdx: number): any {
        let field = el.item.field;
        let val = jel.val();
        console.log(`change for ${el.guid.ToString()} at index ${recIdx} with new value of ${jel.val()}`);
        this.storeManager.GetStore(el.item.associatedStoreName).SetProperty(recIdx, field, val, builder).UpdatePhysicalStorage(recIdx, field, val);

        return val;
    }

    private SetComboboxColor(jel: JQuery, val: any): void {
        let listStoreName = jel.attr('listStore');
        let listStore = this.storeManager.GetStore(listStoreName);
        let selectedIdx = listStore.FindRecord(r => r.text == val);

        if (selectedIdx != -1) {
            let bcolor = listStore.GetProperty(selectedIdx, "bcolor");
            jel.css("background-color", bcolor);
        }
    }
}