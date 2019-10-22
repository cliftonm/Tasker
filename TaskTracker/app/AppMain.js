// Sort of works, I get "Cannot read property 'default' of undefined"
// import * as jQuery from "../lib/jquery"
define(["require", "exports", "./classes/TemplateBuilder", "./enums/StoreType", "./classes/StoreManager", "./stores/ParentChildStore", "./classes/EventRouter", "./stores/SequenceStore"], function (require, exports, TemplateBuilder_1, StoreType_1, StoreManager_1, ParentChildStore_1, EventRouter_1, SequenceStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Globals, implemented poorly for now:
    var storeManager;
    var eventRouter;
    var parentChildRelationshipStore;
    // Add bugs and meetings
    var relationships = [
        {
            parent: "Projects",
            children: ["Tasks", "Contacts", "Notes"]
        },
        {
            parent: "Tasks",
            children: ["Notes"]
        }
    ];
    var builders = {};
    class AppMain {
        GetBuilderName(parentStoreName, childStoreName) {
            return (parentStoreName || "") + "-" + childStoreName;
        }
        CreateHtmlTemplate(templateContainerID, template, storeManager, storeName, parentStoreName) {
            let builder = new TemplateBuilder_1.TemplateBuilder(templateContainerID);
            let builderName = this.GetBuilderName(parentStoreName, storeName);
            builders[builderName] = { builder, template: templateContainerID };
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
        SetStoreIndex(html, idx) {
            // a "replace all" function.
            let newHtml = html.split("{idx}").join(idx.toString());
            return newHtml;
        }
        run() {
            let projectTemplate = [
                {
                    field: "Project",
                    line: 0,
                    width: "80%",
                    control: "textbox",
                },
                {
                    field: "Status",
                    storeName: "ProjectStatusList",
                    orderBy: "StatusOrder",
                    line: 0,
                    width: "20%",
                    control: "combobox",
                },
                {
                    field: "Description",
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
            let taskTemplate = [
                {
                    field: "Task",
                    line: 0,
                    width: "80%",
                    control: "textbox",
                },
                {
                    field: "Status",
                    storeName: "TaskStatusList",
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
            let contactTemplate = [
                { field: "Name", line: 0, width: "50%", control: "textbox" },
                { field: "Email", line: 0, width: "50%", control: "textbox" },
                { field: "Comment", line: 1, width: "80%", control: "textbox" },
                { text: "Delete", line: 1, width: "20%", control: "button", route: "DeleteRecord" }
            ];
            let projectStates = [
                { text: 'Ongoing' },
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
            storeManager = new StoreManager_1.StoreManager();
            let seqStore = new SequenceStore_1.SequenceStore(storeManager, StoreType_1.StoreType.LocalStorage, "Sequences");
            storeManager.RegisterStore(seqStore);
            seqStore.Load();
            storeManager.getPrimaryKeyCallback = (storeName) => {
                return { __ID: seqStore.GetNext(storeName) };
            };
            storeManager.AddInMemoryStore("ProjectStatusList", projectStates);
            storeManager.AddInMemoryStore("TaskStatusList", taskStates);
            parentChildRelationshipStore = new ParentChildStore_1.ParentChildStore(storeManager, StoreType_1.StoreType.LocalStorage, "ParentChildRelationships");
            storeManager.RegisterStore(parentChildRelationshipStore);
            parentChildRelationshipStore.Load();
            let projectStore = this.CreateStoreViewFromTemplate(storeManager, "Projects", StoreType_1.StoreType.LocalStorage, "#projectTemplateContainer", projectTemplate, "#createProject", true, undefined, (idx, store) => store.SetDefault(idx, "Status", projectStates[0].text));
            let taskStore = this.CreateStoreViewFromTemplate(storeManager, "Tasks", StoreType_1.StoreType.LocalStorage, "#taskTemplateContainer", taskTemplate, "#createTask", false, projectStore, (idx, store) => store.SetDefault(idx, "Status", taskStates[0].text));
            this.CreateStoreViewFromTemplate(storeManager, "Contacts", StoreType_1.StoreType.LocalStorage, "#contactTemplateContainer", contactTemplate, "#createProjectContact", false, projectStore);
            // We're creating 2 identical stores!
            this.CreateStoreViewFromTemplate(storeManager, "Notes", StoreType_1.StoreType.LocalStorage, "#projectNoteTemplateContainer", noteTemplate, "#createProjectNote", false, projectStore);
            this.CreateStoreViewFromTemplate(storeManager, "Notes", StoreType_1.StoreType.LocalStorage, "#taskNoteTemplateContainer", noteTemplate, "#createTaskNote", false, taskStore);
            eventRouter = new EventRouter_1.EventRouter();
            eventRouter.AddRoute("DeleteRecord", (store, idx, builder) => {
                store.DeleteRecord(idx, builder);
                store.Save();
            });
            eventRouter.AddRoute("CreateRecord", (store, idx, builder) => store.CreateRecord(builder, true));
        }
        AssignStoreCallbacks(store) {
            store.recordCreatedCallback = (idx, record, insert, store, builder) => {
                this.CreateRecordView(builder, store, idx, insert);
                this.FocusOnFirstField(builder, idx);
            };
            store.propertyChangedCallback = (idx, field, value, store, builder) => this.UpdatePropertyView(builder, store, idx, field, value);
            store.recordDeletedCallback = (idx, store, builder) => {
                // Remove child template views before we start deleting relationships!
                this.RemoveChildRecordsView(store, idx);
                parentChildRelationshipStore.DeleteRelationship(store, idx);
                this.DeleteRecordView(builder, idx);
            };
        }
        CreateRecordView(builder, store, idx, insert) {
            let record = store.GetRecord(idx);
            let html = builder.html;
            let template = this.SetStoreIndex(html, idx);
            if (insert) {
                jQuery(builder.templateContainerID).prepend(template);
            }
            else {
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
        FocusOnFirstField(builder, idx) {
            let tel = builder.elements[0];
            let guid = tel.guid.ToString();
            jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`).focus();
        }
        UpdatePropertyView(builder, store, idx, field, value) {
            let tel = builder.elements.find(e => e.item.field == field);
            let guid = tel.guid.ToString();
            let jel = jQuery(`[bindGuid = '${guid}'][storeIdx = '${idx}']`);
            jel.val(value);
        }
        DeleteRecordView(builder, idx) {
            // Not all stores have views.
            if (builder) {
                console.log(`Removing template view: ${builder.templateContainerID} > [templateIdx='${idx}']`);
                let path = `${builder.templateContainerID} > [templateIdx='${idx}']`;
                jQuery(path).remove();
            }
        }
        DeleteAllRecordsView(builder) {
            let path = `${builder.templateContainerID}`;
            jQuery(path).children().remove();
        }
        BindElementEvents(builder, onCondition) {
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
                                this.RemoveChildRecordsView(store, store.selectedRecordIndex);
                                this.RecordSelected(builder, recIdx);
                                store.selectedRecordIndex = recIdx;
                                this.ShowChildRecords(store, recIdx);
                            }
                        });
                        switch (el.item.control) {
                            case "button":
                                jel.on('click', () => {
                                    console.log(`click for ${guid} at index ${recIdx}`);
                                    eventRouter.Route(el.item.route, store, recIdx, builder);
                                });
                                break;
                            case "textarea":
                            case "textbox":
                            case "combobox":
                                jel.on('change', () => {
                                    let field = el.item.field;
                                    let val = jel.val();
                                    console.log(`change for ${el.guid.ToString()} at index ${recIdx} with new value of ${jel.val()}`);
                                    storeManager.GetStore(el.item.associatedStoreName).SetProperty(recIdx, field, val, builder).UpdatePhysicalStorage(recIdx, field, val);
                                });
                                break;
                        }
                    }
                });
            });
        }
        RecordSelected(builder, recIdx) {
            jQuery(builder.templateContainerID).children().removeClass("recordSelected");
            let path = `${builder.templateContainerID} > [templateIdx='${recIdx}']`;
            jQuery(path).addClass("recordSelected");
        }
        ShowChildRecords(parentStore, parentRecIdx) {
            let parentStoreName = parentStore.storeName;
            let parentId = parentStore.GetProperty(parentRecIdx, "__ID");
            let relArray = relationships.filter(r => r.parent == parentStoreName);
            // Only one record for the parent type should exist.
            if (relArray.length == 1) {
                let rel = relArray[0];
                rel.children.forEach(child => {
                    let builderName = this.GetBuilderName(parentStoreName, child);
                    if (builders[builderName]) {
                        let builder = builders[builderName].builder;
                        let childRecs = parentChildRelationshipStore.GetChildInfo(parentStoreName, parentId, child);
                        let childStore = childRecs.store;
                        childRecs.childrenIndices.map(idx => Number(idx)).forEach(recIdx => {
                            this.CreateRecordView(builder, childStore, recIdx, false);
                        });
                    }
                    else {
                        console.log(`Builders collection does not have an entry for the builder: ${builderName}`);
                    }
                });
            }
        }
        // Recursively remove all child view records.
        RemoveChildRecordsView(store, recIdx) {
            let storeName = store.storeName;
            let id = store.GetProperty(recIdx, "__ID");
            let rels = relationships.filter(r => r.parent == storeName);
            if (rels.length == 1) {
                let childEntities = rels[0].children;
                childEntities.forEach(childEntity => {
                    if (storeManager.HasStore(childEntity)) {
                        var info = parentChildRelationshipStore.GetChildInfo(storeName, id, childEntity);
                        info.childrenIndices.forEach(childRecIdx => {
                            let builderName = this.GetBuilderName(storeName, childEntity);
                            let builder = builders[builderName].builder;
                            this.DeleteRecordView(builder, childRecIdx);
                            this.RemoveChildRecordsView(storeManager.GetStore(childEntity), childRecIdx);
                        });
                    }
                });
            }
            /*
            relChild.children.forEach(grandchild => {
                let builderName = this.GetBuilderName(child, grandchild);
    
                if (builders[builderName]) {
                    let builder = builders[builderName].builder;
                    this.DeleteAllRecordsView(builder);
    
                    let relArray = relationships.filter(r => r.parent == grandchild);
                    if (relArray.length == 1) {
                        let rel = relArray[0];
                        this.RemoveChildRecordsView(grandchild, rel);
                    }
                } else {
                    console.log(`Builders collection does not have an entry for the builder: ${builderName}`);
                }
            });
            */
        }
        CreateStoreViewFromTemplate(storeManager, storeName, storeType, containerName, template, createButtonId, updateView = true, parentStore = undefined, createCallback = _ => { }) {
            // ?. operator.  
            // Supposedly TypeScript 3.7 has it, but I can't select that version in VS2017.  VS2019?
            let parentStoreName = parentStore && parentStore.storeName || undefined;
            let builder = this.CreateHtmlTemplate(containerName, template, storeManager, storeName, parentStoreName);
            let store = undefined;
            if (storeManager.HasStore(storeName)) {
                store = storeManager.GetStore(storeName);
            }
            else {
                store = storeManager.CreateStore(storeName, storeType);
                this.AssignStoreCallbacks(store);
            }
            jQuery(document).ready(() => {
                if (updateView) {
                    this.BindElementEvents(builder, _ => true);
                }
                jQuery(createButtonId).on('click', () => {
                    let idx = eventRouter.Route("CreateRecord", store, 0, builder); // insert at position 0
                    createCallback(idx, store);
                    if (parentStore) {
                        parentChildRelationshipStore.AddRelationship(parentStore, store, idx);
                    }
                    store.Save();
                });
            });
            store.Load(updateView, builder);
            return store;
        }
    }
    exports.AppMain = AppMain;
    ;
});
//# sourceMappingURL=AppMain.js.map