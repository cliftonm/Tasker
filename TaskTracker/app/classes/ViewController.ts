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
    selectedRecordIndex: number = -1;        // multiple selection not allowed at the moment.

    // TODO: This should be passed in, not created for every view controller.
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
        this.builder = this.CreateHtmlTemplate(containerName, template);

        if (parentViewController) {
            parentViewController.RegisterChildController(this);
        }

        if (this.storeManager.HasStore(storeName)) {
            this.store = this.storeManager.GetStore(storeName);
        } else {
            this.store = this.storeManager.CreateStore(storeName, storeType);
            this.AssignStoreCallbacks();
        }

        // TODO: Wiring up the click even here precludes the ability to create view controllers from the UI after the document is ready.
        jQuery(document).ready(() => {
            jQuery(createButtonId).on('click', () => {
                let idx = this.eventRouter.Route("CreateRecord", this.store, 0, this);   // insert at position 0
                createCallback(idx, this.store);

                if (parentViewController) {
                    this.parentChildRelationshipStore.AddRelationship(parentViewController.store, this.store, parentViewController.selectedRecordIndex, idx);
                }

                this.store.Save();
            });
        });

        this.store.Load(updateView, this);

        return this.store;
    }

    private RegisterChildController(childViewController: ViewController): void {
        this.childControllers.push(childViewController)
    }

    private CreateHtmlTemplate(templateContainerID: string, template: Items): TemplateBuilder {
        let builder = new TemplateBuilder(templateContainerID);
        let line = -1;
        let firstLine = true;

        builder.TemplateDivBegin();

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
                    builder.TextInput(item);
                    break;

                case "textarea":
                    builder.TextArea(item);
                    break;

                case "combobox":
                    builder.Combobox(item, this.storeManager);
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

    private RecordSelected(recIdx: number): void {
        // Remove recordSelected class from all elements in the container.
        jQuery(this.builder.templateContainerID).children().removeClass("recordSelected");
        // Add recordSelected class to the specific selected element in the container.
        let path = `${this.builder.templateContainerID} > [templateIdx='${recIdx}']`;
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
                    let vc = this.childControllers.find(c => c.store.storeName == child);
                    console.log(`Store: ${vc.store.storeName}  Child Store: ${childRecs.store.storeName}   parent:${parentStoreName}   child:${child}`);
                    console.log(`Creating template view: ${vc.builder.templateContainerID} > [recIdx='${recIdx}']`);
                    vc.CreateRecordView(childStore, recIdx, false);
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
                // if (this.storeManager.HasStore(childEntity)) {
                    var info = this.parentChildRelationshipStore.GetChildInfo(storeName, id, childEntity);
                    info.childrenIndices.forEach(childRecIdx => {
                        let vc = this.childControllers.find(c => c.store.storeName == childEntity);
                        vc.DeleteRecordView(childRecIdx);
                        vc.RemoveChildRecordsView(this.storeManager.GetStore(childEntity), childRecIdx);
                    });
                // }
            });
        }
    }

    private AssignStoreCallbacks(): void {
        this.store.recordCreatedCallback = (idx, record, insert, store, onLoad, viewController) => {

            viewController.CreateRecordView(this.store, idx, insert, onLoad);

            // Don't select the first field when called from Store.Load, as this will select the 
            // first field for every record, leaving the last record selected.  Plus we're not
            // necessarily ready to load up child records yet since the necessary view controllers
            // haven't been created.
            if (!onLoad) {
                viewController.FocusOnFirstField(idx);
            }
        };

        this.store.propertyChangedCallback = (idx, field, value) => this.UpdatePropertyView(idx, field, value);
        this.store.recordDeletedCallback = (idx, store, viewController) => {
            // A store can be associated with multiple builders: A-B-C and A-D-C, where the store is C
            viewController.RemoveChildRecordsView(store, idx);
            viewController.parentChildRelationshipStore.DeleteRelationship(store, idx);
            viewController.DeleteRecordView(idx);
        }
    }

    private SetStoreIndex(html: string, idx: number): string {
        // a "replace all" function.
        let newHtml = html.split("{idx}").join(idx.toString());

        return newHtml;
    }

    // A store can be associated with multiple builders: A-B-C and A-D-C, where the store is C
    // Another pattern would be A-B-C and D-B-C, where the store is either B or C
    // This callback occurs for the first view controller that created the store and therefore does not
    // actually know what view controller the create record should be applied to.
    private CreateRecordView(store: Store, idx: number, insert: boolean, onLoad: boolean = false): void {
        let record = store.GetRecord(idx);
        let html = this.builder.html;
        let template = this.SetStoreIndex(html, idx);

        if (insert) {
            jQuery(this.builder.templateContainerID).prepend(template);
        } else {
            jQuery(this.builder.templateContainerID).append(template);
        }

        // Only wire up the events for the record we just created, the rest are wired up already.
        this.BindElementEvents(onLoad, recIdx => recIdx == idx);

        for (let j = 0; j < this.builder.elements.length; j++) {
            let tel = this.builder.elements[j];
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

    private FocusOnFirstField(idx: number) {
        let tel = this.builder.elements[0];
        let guid = tel.guid.ToString();
        jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`).focus();
    }

    private UpdatePropertyView(idx: number, field: string, value: any): void {
        let tel = this.builder.elements.find(e => e.item.field == field);
        let guid = tel.guid.ToString();
        let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
        jel.val(value);
    }

    private DeleteRecordView(idx: number): void {
        console.log(`Removing template view: ${this.builder.templateContainerID} > [templateIdx='${idx}']`);
        let path = `${this.builder.templateContainerID} > [templateIdx='${idx}']`;
        jQuery(path).remove();
        this.selectedRecordIndex = -1;
    }

    /*
    private DeleteAllRecordsView(builder: TemplateBuilder) : void {
        let path = `${builder.templateContainerID}`;
        jQuery(path).children().remove();
    }
    */

    private BindElementEvents(onLoad: boolean, onCondition: (recIdx: number) => boolean): void {
        this.builder.elements.forEach(el => {
            let guid = el.guid.ToString();
            let jels = jQuery(`[bindGuid = '${guid}']`);
            console.log(`>>> store:${this.store.storeName}  guid:${guid}  el:${el.item.control}  onLoad:${onLoad}`);

            jels.each((_, elx) => {
                let jel = jQuery(elx);
                let recIdx = Number(jel.attr("storeIdx"));

                if (onCondition(recIdx)) {
                    // console.log(`Binding guid:${guid} with recIdx:${recIdx}`);
                    jel.on('focus', () => {
                        console.log(`focus: recIdx: ${recIdx}  store:${this.store.storeName}`);

                        if (this.selectedRecordIndex != recIdx) {
                            this.RemoveChildRecordsView(this.store, this.selectedRecordIndex);
                            this.RecordSelected(recIdx);
                            this.selectedRecordIndex = recIdx;
                            this.ShowChildRecords(this.store, recIdx);
                        }
                    });

                    switch (el.item.control) {
                        case "button":
                            jel.on('click', () => {
                                // console.log(`click for ${guid} at index ${recIdx}`);
                                this.eventRouter.Route(el.item.route, this.store, recIdx, this);
                            });
                            break;

                        case "textarea":
                        case "textbox":
                            jel.on('change', () => {
                                this.SetPropertyValue(jel, el, recIdx);
                            });
                            break;

                        case "combobox":
                            jel.on('change', () => {
                                let val = this.SetPropertyValue(jel, el, recIdx);
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

    private SetPropertyValue(jel: JQuery, el: TemplateElement, recIdx: number): any {
        let field = el.item.field;
        let val = jel.val();
        console.log(`change for ${el.guid.ToString()} at index ${recIdx} with new value of ${jel.val()}`);
        // this.storeManager.GetStore(el.item.associatedStoreName).SetProperty(recIdx, field, val, builder).UpdatePhysicalStorage(recIdx, field, val);
        this.store.SetProperty(recIdx, field, val).UpdatePhysicalStorage(recIdx, field, val);

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