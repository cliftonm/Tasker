define(["require", "exports", "./Helpers", "./TemplateBuilder"], function (require, exports, Helpers_1, TemplateBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EntityViewController {
        constructor(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships) {
            this.childControllers = [];
            this.selectedRecordIndex = -1; // multiple selection not allowed at the moment.
            this.storeManager = storeManager;
            this.parentChildRelationshipStore = parentChildRelationshipStore;
            this.eventRouter = eventRouter;
            this.auditLogStore = auditLogStore;
            this.relationships = relationships;
        }
        CreateView(storeName, persistence, containerName, template, createButtonId, updateView = true, parentViewController, createCallback = _ => { }) {
            // ?. operator.  
            // Supposedly TypeScript 3.7 has it, but I can't select that version in VS2017.  VS2019?
            this.builder = this.CreateHtmlTemplate(containerName, template);
            this.parentViewController = parentViewController;
            this.containerName = containerName;
            if (parentViewController) {
                parentViewController.RegisterChildController(this);
            }
            if (this.storeManager.HasStore(storeName)) {
                this.store = this.storeManager.GetStore(storeName);
            }
            else {
                this.store = this.storeManager.CreateStore(storeName, persistence, this.auditLogStore);
                this.AssignStoreCallbacks();
                this.store.Load(updateView, this);
            }
            // TODO: Wiring up the click even here precludes the ability to create view controllers from the UI after the document is ready.
            jQuery(document).ready(() => {
                jQuery(createButtonId).on('click', () => {
                    let idx = this.eventRouter.Route("CreateRecord", this.store, 0, this); // insert at position 0
                    createCallback(idx, this.store);
                    if (parentViewController) {
                        this.parentChildRelationshipStore.AddRelationship(parentViewController.store, this.store, parentViewController.selectedRecordIndex, idx);
                    }
                    this.store.Save();
                });
            });
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
                    case "label":
                        builder.Label(item);
                }
                builder.DivEnd();
            });
            builder.DivClear();
            builder.TemplateDivEnd();
            return builder;
        }
        // Show all records for the store, regardless of parent selection.
        ShowAllRecords() {
            this.ShowView();
            Object.keys(this.store.data).forEach(recIdx => this.CreateRecordView(this.store, Number(recIdx), true, false));
        }
        // After deleting a record, if this is the only selected record, we need to go back to
        // showing all records, otherwise the user will see an empty list!
        ShowAllChildRecords() {
            jQuery(this.builder.templateContainerID).children().css("display", "");
        }
        ShowView() {
            jQuery(this.builder.templateContainerID).parent().css("visibility", "visible");
            jQuery(this.builder.templateContainerID).parent().css("display", "");
        }
        HideView() {
            jQuery(this.builder.templateContainerID).parent().css("visibility", "hidden");
            jQuery(this.builder.templateContainerID).parent().css("display", "none");
        }
        // Return true if result is a visible template.
        ToggleVisibility() {
            let state = jQuery(this.builder.templateContainerID).parent().css("visibility");
            state == "visible" ? this.HideView() : this.ShowView();
            return state != "visible";
        }
        SelectRecord(recIdx) {
            this.selectedRecordIndex = recIdx;
            this.RecordSelected(recIdx);
        }
        RecordSelected(recIdx) {
            // Remove recordSelected class from all elements in the container.
            jQuery(this.builder.templateContainerID).children().removeClass("recordSelected");
            // Add recordSelected class to the specific selected element in the container.
            let path = `${this.builder.templateContainerID} > [templateIdx='${recIdx}']`;
            jQuery(path).addClass("recordSelected");
        }
        RecordUnselected(recIdx) {
            // Remove recordSelected class from all elements in the container.
            jQuery(this.builder.templateContainerID).children().removeClass("recordSelected");
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
                        console.log(`Creating template view: ${vc.builder.templateContainerID} > [recIdx='${recIdx}']`);
                        vc.CreateRecordView(childStore, recIdx, false);
                    });
                });
            }
        }
        ShowSiblingsOf(templateContainer) {
            templateContainer.siblings().css("display", "");
        }
        HideSiblingsOf(templateContainer) {
            templateContainer.siblings().css("display", "none");
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
                viewController.parentChildRelationshipStore.DeleteRelationship(store, idx, viewController);
                viewController.DeleteRecordView(idx);
            };
        }
        SetStoreIndex(html, idx) {
            // a "replace all" function.
            let newHtml = Helpers_1.Helpers.ReplaceAll(html, "{idx}", idx.toString());
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
            // Hack!
            if (tel.item.control == "combobox") {
                this.SetComboboxColor(jel, value);
            }
        }
        DeleteRecordView(idx) {
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
        BindElementEvents(onLoad, onCondition) {
            this.builder.elements.forEach(el => {
                let guid = el.guid.ToString();
                let jels = jQuery(`[bindGuid = '${guid}']`);
                jels.each((_, elx) => {
                    let jel = jQuery(elx);
                    let recIdx = Number(jel.attr("storeIdx"));
                    if (onCondition(recIdx)) {
                        // console.log(`Binding guid:${guid} with recIdx:${recIdx}`);
                        jel.on('click', (e) => {
                            let templateContainer = jQuery(e.currentTarget).parent().parent();
                            // let templateIdx = templateContainer.attr("templateIdx");
                            if (this.selectedRecordIndex != recIdx) {
                                this.RemoveChildRecordsView(this.store, this.selectedRecordIndex);
                                this.RecordSelected(recIdx);
                                this.selectedRecordIndex = recIdx;
                                this.ShowChildRecords(this.store, recIdx);
                                this.HideSiblingsOf(templateContainer);
                                // Show selected child containers as selected by the menubar
                                this.eventRouter.Route("MenuBarShowSections", undefined, undefined, this);
                            }
                            else {
                                let firstElement = jQuery(e.currentTarget).parent()[0] == jQuery(e.currentTarget).parent().parent().children()[0];
                                if (firstElement) {
                                    // If user clicks on the first element of selected record,
                                    // the deselect the record, show all siblings, and hide all child records.
                                    this.ShowSiblingsOf(templateContainer);
                                    this.RemoveChildRecordsView(this.store, this.selectedRecordIndex);
                                    this.RecordUnselected(recIdx);
                                    this.selectedRecordIndex = -1;
                                    // Hide selected child containers as selected by the menubar
                                    this.eventRouter.Route("MenuBarHideSections", undefined, undefined, this);
                                }
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
        SetPropertyValue(jel, el, recIdx) {
            let field = el.item.field;
            let val = jel.val();
            console.log(`change for ${el.guid.ToString()} at index ${recIdx} with new value of ${jel.val()}`);
            // this.storeManager.GetStore(el.item.associatedStoreName).SetProperty(recIdx, field, val, builder).UpdatePhysicalStorage(recIdx, field, val);
            this.store.SetProperty(recIdx, field, val).Save();
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
    exports.EntityViewController = EntityViewController;
});
//# sourceMappingURL=EntityViewController.js.map