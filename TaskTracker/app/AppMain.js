// Sort of works, I get "Cannot read property 'default' of undefined"
// import * as jQuery from "../lib/jquery"
define(["require", "exports", "./classes/ViewController", "./classes/StoreManager", "./stores/ParentChildStore", "./stores/AuditLogStore", "./classes/EventRouter", "./stores/SequenceStore", "./classes/CloudPersistence", "./classes/Guid"], function (require, exports, ViewController_1, StoreManager_1, ParentChildStore_1, AuditLogStore_1, EventRouter_1, SequenceStore_1, CloudPersistence_1, Guid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Add bugs and meetings
    class AppMain {
        run() {
            let projectTemplate = [
                {
                    field: "Project",
                    line: 0,
                    width: "80%",
                    control: "textbox",
                    style: "bold"
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
                    width: "80px",
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
                    style: "bold"
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
                    width: "80px",
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
                    width: "80px",
                    control: "button",
                    route: "DeleteRecord",
                }
            ];
            let contactTemplate = [
                { field: "Name", line: 0, width: "30%", control: "textbox" },
                { field: "Email", line: 0, width: "30%", control: "textbox" },
                { field: "Title", line: 0, width: "30%", control: "textbox" },
                { field: "Comment", line: 1, width: "80%", control: "textbox" },
                { text: "Delete", line: 1, width: "80px", control: "button", route: "DeleteRecord" }
            ];
            let linkTemplate = [
                { field: "Description", line: 0, width: "20%", control: "textbox" },
                { field: "URL", line: 0, width: "40%", control: "textbox" },
                { text: "Delete", line: 0, width: "80px", control: "button", route: "DeleteRecord" }
            ];
            let bugTemplate = [
                { field: "Description", line: 0, width: "70%", control: "textbox" },
                { field: "Status", storeName: "BugStatusList", orderBy: "StatusOrder", line: 0, width: "20%", control: "combobox" },
                { text: "Delete", line: 0, width: "80px", control: "button", route: "DeleteRecord" }
            ];
            let projectStates = [
                { text: 'Ongoing', bcolor: '#B0B0FF' },
                { text: 'TODO', bcolor: '#FFB0B0' },
                { text: 'Working On', bcolor: '#D0D0FF' },
                { text: 'Testing', bcolor: '#D0D0FF' },
                { text: 'QA', bcolor: '#D0D0FF' },
                { text: 'Done', bcolor: '#D0FFD0' },
                { text: 'On Production', bcolor: '#60FF60' },
                { text: 'Waiting on 3rd Party', bcolor: '#FFA540' },
                { text: 'Waiting on Coworker', bcolor: '#FFA540' },
                { text: 'Waiting on Management', bcolor: '#FFA540' },
                { text: 'Stuck', bcolor: 'red' },
                { text: 'Discuss', bcolor: 'red' },
            ];
            let taskStates = [
                { text: 'TODO', bcolor: '#FFB0B0' },
                { text: 'Working On', bcolor: '#D0D0FF' },
                { text: 'Testing', bcolor: '#D0D0FF' },
                { text: 'QA', bcolor: '#D0D0FF' },
                { text: 'Done', bcolor: '#D0FFD0' },
                { text: 'On Production', bcolor: '#60FF60' },
                { text: 'Waiting on 3rd Party', bcolor: '#FFA540' },
                { text: 'Waiting on Coworker', bcolor: '#FFA540' },
                { text: 'Waiting on Management', bcolor: '#FFA540' },
                { text: 'Stuck', bcolor: 'red' },
                { text: 'Discuss', bcolor: 'red' },
            ];
            let bugStates = [
                { text: 'TODO', bcolor: '#FFB0B0' },
                { text: 'Working On', bcolor: '#D0D0FF' },
                { text: 'Testing', bcolor: '#D0D0FF' },
                { text: 'QA', bcolor: '#D0D0FF' },
                { text: 'Done', bcolor: '#D0FFD0' },
                { text: 'On Production', bcolor: '#60FF60' },
                { text: 'Waiting on 3rd Party', bcolor: '#FFA540' },
                { text: 'Waiting on Coworker', bcolor: '#FFA540' },
                { text: 'Waiting on Management', bcolor: '#FFA540' },
                { text: 'Stuck', bcolor: 'red' },
                { text: 'Discuss', bcolor: 'red' },
            ];
            let userId = new Guid_1.Guid("00000000-0000-0000-0000-000000000000");
            let storeManager = new StoreManager_1.StoreManager();
            // let persistence = new LocalStoragePersistence();
            let persistence = new CloudPersistence_1.CloudPersistence("http://127.0.0.1/", userId);
            let auditLogStore = new AuditLogStore_1.AuditLogStore(storeManager, persistence, "AuditLogStore", undefined);
            storeManager.RegisterStore(auditLogStore);
            auditLogStore.Load();
            persistence.SetAuditLogStore(auditLogStore);
            let seqStore = new SequenceStore_1.SequenceStore(storeManager, persistence, "Sequences", auditLogStore);
            storeManager.RegisterStore(seqStore);
            seqStore.Load();
            storeManager.getPrimaryKeyCallback = (storeName) => {
                return { __ID: seqStore.GetNext(storeName) };
            };
            storeManager.AddInMemoryStore("ProjectStatusList", projectStates);
            storeManager.AddInMemoryStore("TaskStatusList", taskStates);
            storeManager.AddInMemoryStore("BugStatusList", bugStates);
            let parentChildRelationshipStore = new ParentChildStore_1.ParentChildStore(storeManager, persistence, "ParentChildRelationships", auditLogStore);
            storeManager.RegisterStore(parentChildRelationshipStore);
            parentChildRelationshipStore.Load();
            let eventRouter = new EventRouter_1.EventRouter();
            eventRouter.AddRoute("DeleteRecord", (store, idx, viewController) => {
                store.DeleteRecord(idx, viewController);
                store.Save();
            });
            eventRouter.AddRoute("CreateRecord", (store, idx, viewController) => store.CreateRecord(true, viewController));
            let vcProjects = new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore);
            vcProjects.CreateStoreViewFromTemplate("Projects", persistence, "#projectTemplateContainer", projectTemplate, "#createProject", true, undefined, (idx, store) => store.SetDefault(idx, "Status", projectStates[0].text));
            let vcBugs = new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore);
            vcBugs.CreateStoreViewFromTemplate("Bugs", persistence, "#projectBugTemplateContainer", bugTemplate, "#createProjectBug", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", bugStates[0].text));
            new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Notes", persistence, "#bugNoteTemplateContainer", noteTemplate, "#createBugNote", false, vcBugs);
            let vcTasks = new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore);
            vcTasks.CreateStoreViewFromTemplate("Tasks", persistence, "#projectTaskTemplateContainer", taskTemplate, "#createTask", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", taskStates[0].text));
            new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Tasks", persistence, "#taskTaskTemplateContainer", taskTemplate, "#createSubtask", false, vcTasks);
            new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Contacts", persistence, "#projectContactTemplateContainer", contactTemplate, "#createProjectContact", false, vcProjects);
            new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Links", persistence, "#projectLinkTemplateContainer", linkTemplate, "#createProjectLink", false, vcProjects);
            new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Links", persistence, "#taskLinkTemplateContainer", linkTemplate, "#createTaskLink", false, vcTasks);
            new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Notes", persistence, "#projectNoteTemplateContainer", noteTemplate, "#createProjectNote", false, vcProjects);
            new ViewController_1.ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Notes", persistence, "#taskNoteTemplateContainer", noteTemplate, "#createTaskNote", false, vcTasks);
        }
    }
    exports.AppMain = AppMain;
    ;
});
//# sourceMappingURL=AppMain.js.map