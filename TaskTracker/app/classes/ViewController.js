define(["require", "exports", "./TemplateBuilder"], function (require, exports, TemplateBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewController {
        constructor(storeManager, parentChildRelationshipStore, eventRouter) {
            this.childControllers = [];
            // ready: boolean = false;
            this.relationships = [
                {
                    parent: "Projects",
                    children: ["Tasks", "Contacts", "Links", "Notes"]
                },
                {
                    parent: "Tasks",
                    children: ["Links", "Notes"]
                }
            ];
            this.storeManager = storeManager;
            this.parentChildRelationshipStore = parentChildRelationshipStore;
            this.eventRouter = eventRouter;
        }
        CreateStoreViewFromTemplate(storeName, storeType, containerName, template, createButtonId, updateView = true, parentViewController, createCallback = _ => { }) {
            // ?. operator.  
            // Supposedly TypeScript 3.7 has it, but I can't select that version in VS2017.  VS2019?
            this.builder = this.CreateHtmlTemplate(containerName, template);
            if (parentViewController) {
                parentViewController.RegisterChildController(this);
            }
            if (this.storeManager.HasStore(storeName)) {
                this.store = this.storeManager.GetStore(storeName);
            }
            else {
                this.store = this.storeManager.CreateStore(storeName, storeType);
                this.AssignStoreCallbacks();
            }
            jQuery(document).ready(() => {
                jQuery(createButtonId).on('click', () => {
                    let idx = this.eventRouter.Route("CreateRecord", this.store, 0); // insert at position 0
                    createCallback(idx, this.store);
                    if (parentViewController) {
                        this.parentChildRelationshipStore.AddRelationship(parentViewController.store, this.store, idx);
                    }
                    this.store.Save();
                });
            });
            this.store.Load(updateView);
            return this.store;
        }
        RegisterChildController(childViewController) {
            this.childControllers.push(childViewController);
        }
        CreateHtmlTemplate(templateContainerID, template) {
            let builder = new TemplateBuilder_1.TemplateBuilder(templateContainerID);
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
        RecordSelected(recIdx) {
            // Remove recordSelected class from all elements in the container.
            jQuery(this.builder.templateContainerID).children().removeClass("recordSelected");
            // Add recordSelected class to the specific selected element in the container.
            let path = `${this.builder.templateContainerID} > [templateIdx='${recIdx}']`;
            jQuery(path).addClass("recordSelected");
        }
        ShowChildRecords(parentStore, parentRecIdx) {
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
        RemoveChildRecordsView(store, recIdx) {
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
        AssignStoreCallbacks() {
            this.store.recordCreatedCallback = (idx, record, insert, store, onLoad) => {
                this.CreateRecordView(this.store, idx, insert, onLoad);
                if (!onLoad) {
                    this.FocusOnFirstField(idx);
                }
            };
            this.store.propertyChangedCallback = (idx, field, value) => this.UpdatePropertyView(idx, field, value);
            this.store.recordDeletedCallback = (idx, store) => {
                // A store can be associated with multiple builders: A-B-C and A-D-C, where the store is C
                // While this callback occurs for the first view controller that created the store,
                // It works because the idx in store C is unique for the relationship A-B-C and A-D-C.
                // Remove child template views before we start deleting relationships!
                this.RemoveChildRecordsView(store, idx);
                this.parentChildRelationshipStore.DeleteRelationship(store, idx);
                this.DeleteRecordView(idx);
            };
        }
        SetStoreIndex(html, idx) {
            // a "replace all" function.
            let newHtml = html.split("{idx}").join(idx.toString());
            return newHtml;
        }
        // A store can be associated with multiple builders: A-B-C and A-D-C, where the store is C
        // Another pattern would be A-B-C and D-B-C, where the store is either B or C
        // This callback occurs for the first view controller that created the store and therefore does not
        // actually know what view controller the create record should be applied to.
        CreateRecordView(store, idx, insert, onLoad = false) {
            let record = store.GetRecord(idx);
            let html = this.builder.html;
            let template = this.SetStoreIndex(html, idx);
            if (insert) {
                jQuery(this.builder.templateContainerID).prepend(template);
            }
            else {
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
        FocusOnFirstField(idx) {
            let tel = this.builder.elements[0];
            let guid = tel.guid.ToString();
            jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`).focus();
        }
        UpdatePropertyView(idx, field, value) {
            let tel = this.builder.elements.find(e => e.item.field == field);
            let guid = tel.guid.ToString();
            let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
            jel.val(value);
        }
        DeleteRecordView(idx) {
            console.log(`Removing template view: ${this.builder.templateContainerID} > [templateIdx='${idx}']`);
            let path = `${this.builder.templateContainerID} > [templateIdx='${idx}']`;
            jQuery(path).remove();
        }
        /*
        private DeleteAllRecordsView(builder: TemplateBuilder) : void {
            let path = `${builder.templateContainerID}`;
            jQuery(path).children().remove();
        }
        */
        BindElementEvents(onLoad, onCondition) {
            this.builder.elements.forEach(el => {
                let guid = el.guid.ToString();
                let jels = jQuery(`[bindGuid = '${guid}']`);
                let me = this;
                console.log(`>>> store:${this.store.storeName}  guid:${guid}  el:${el.item.control}  onLoad:${onLoad}`);
                jels.each((_, elx) => {
                    let jel = jQuery(elx);
                    let recIdx = Number(jel.attr("storeIdx"));
                    if (onCondition(recIdx)) {
                        // console.log(`Binding guid:${guid} with recIdx:${recIdx}`);
                        jel.on('focus', () => {
                            console.log(`focus: recIdx: ${recIdx}  store:${me.store.storeName}`);
                            if (me.store.selectedRecordIndex != recIdx) {
                                me.RemoveChildRecordsView(me.store, me.store.selectedRecordIndex);
                                me.RecordSelected(recIdx);
                                me.store.selectedRecordIndex = recIdx;
                                me.ShowChildRecords(me.store, recIdx);
                            }
                        });
                        switch (el.item.control) {
                            case "button":
                                jel.on('click', () => {
                                    // console.log(`click for ${guid} at index ${recIdx}`);
                                    this.eventRouter.Route(el.item.route, me.store, recIdx);
                                });
                                break;
                            case "textarea":
                            case "textbox":
                                jel.on('change', () => {
                                    me.SetPropertyValue(jel, el, recIdx);
                                });
                                break;
                            case "combobox":
                                jel.on('change', () => {
                                    let val = me.SetPropertyValue(jel, el, recIdx);
                                    me.SetComboboxColor(jel, val);
                                });
                                // I can't find an event for when the option list is actually shown, so for now 
                                // we reset the background color on focus and restore it on lose focus.
                                jel.on('focus', () => {
                                    jel.css("background-color", "white");
                                });
                                jel.on('blur', () => {
                                    let val = jel.val();
                                    me.SetComboboxColor(jel, val);
                                });
                                break;
                        }
                    }
                });
            });
        }
        SetPropertyValue(jel, el, recIdx) {
            let field = el.item.field;
            let val = jel.val();
            console.log(`change for ${el.guid.ToString()} at index ${recIdx} with new value of ${jel.val()}`);
            // this.storeManager.GetStore(el.item.associatedStoreName).SetProperty(recIdx, field, val, builder).UpdatePhysicalStorage(recIdx, field, val);
            this.store.SetProperty(recIdx, field, val, this.builder).UpdatePhysicalStorage(recIdx, field, val);
            return val;
        }
        SetComboboxColor(jel, val) {
            let listStoreName = jel.attr('listStore');
            let listStore = this.storeManager.GetStore(listStoreName);
            let selectedIdx = listStore.FindRecord(r => r.text == val);
            if (selectedIdx != -1) {
                let bcolor = listStore.GetProperty(selectedIdx, "bcolor");
                jel.css("background-color", bcolor);
            }
        }
    }
    exports.ViewController = ViewController;
});
//# sourceMappingURL=ViewController.js.map