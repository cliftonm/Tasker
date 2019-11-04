/*
delete from AuditLogStore
delete from Bugs
delete from Contacts
delete from Links
delete from Notes
delete from ParentChildRelationships
delete from Projects
delete from [Sequences]
delete from Tasks
*/
define(["require", "exports", "./classes/EntityViewController", "./classes/StoreManager", "./stores/ParentChildStore", "./stores/AuditLogStore", "./classes/EventRouter", "./stores/SequenceStore", "./classes/MenuBarViewController", "./classes/Guid", "./classes/LocalStoragePersistence", "./enums/Justification"], function (require, exports, EntityViewController_1, StoreManager_1, ParentChildStore_1, AuditLogStore_1, EventRouter_1, SequenceStore_1, MenuBarViewController_1, Guid_1, LocalStoragePersistence_1, Justification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Add bugs and meetings
    class AppMain {
        run() {
            let relationships = [
                {
                    parent: "Projects",
                    children: ["Bugs", "Tasks", "Contacts", "Links", "Notes"]
                },
                {
                    parent: "Tasks",
                    children: ["Links", "Notes", "Tasks"]
                },
                {
                    parent: "Bugs",
                    children: ["Notes"]
                }
            ];
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
                { line: 1, width: "10%", control: "label", label: "Work:", justification: Justification_1.Justification.Right },
                { field: "Work Phone", line: 1, width: "35%", control: "textbox" },
                { line: 1, width: "10%", control: "label", label: "Cell:", justification: Justification_1.Justification.Right },
                { field: "Cell Phone", line: 1, width: "35%", control: "textbox" },
                { field: "Comment", line: 2, width: "80%", control: "textbox" },
                { text: "Delete", line: 2, width: "80px", control: "button", route: "DeleteRecord" }
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
            let userId = new Guid_1.Guid("00000000-0000-0000-0000-000000000001");
            let storeManager = new StoreManager_1.StoreManager();
            let persistence = new LocalStoragePersistence_1.LocalStoragePersistence();
            // let persistence = new CloudPersistence("http://127.0.0.1/", userId);
            let auditLogStore = new AuditLogStore_1.AuditLogStore(storeManager, persistence, "AuditLogStore");
            storeManager.RegisterStore(auditLogStore);
            persistence.SetAuditLogStore(auditLogStore);
            persistence.LoadAuditLog();
            let seqStore = new SequenceStore_1.SequenceStore(storeManager, persistence, "Sequences", auditLogStore);
            storeManager.RegisterStore(seqStore);
            seqStore.Load();
            storeManager.getNextPrimaryKeyCallback = (storeName) => {
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
                viewController.ShowAllRecords();
            });
            eventRouter.AddRoute("CreateRecord", (store, idx, viewController) => store.CreateRecord(true, viewController));
            let vcProjects = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjects.CreateView("Projects", persistence, "#projectTemplateContainer", projectTemplate, "#createProject", true, undefined, (idx, store) => store.SetDefault(idx, "Status", projectStates[0].text));
            let vcProjectBugs = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjectBugs.CreateView("Bugs", persistence, "#projectBugTemplateContainer", bugTemplate, "#createProjectBug", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", bugStates[0].text));
            let vcBugNotes = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcBugNotes.CreateView("Notes", persistence, "#bugNoteTemplateContainer", noteTemplate, "#createBugNote", false, vcProjectBugs);
            let vcProjectTasks = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjectTasks.CreateView("Tasks", persistence, "#projectTaskTemplateContainer", taskTemplate, "#createTask", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", taskStates[0].text));
            let vcSubtasks = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcSubtasks.CreateView("Tasks", persistence, "#taskTaskTemplateContainer", taskTemplate, "#createSubtask", false, vcProjectTasks);
            let vcProjectContacts = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjectContacts.CreateView("Contacts", persistence, "#projectContactTemplateContainer", contactTemplate, "#createProjectContact", false, vcProjects);
            let vcProjectLinks = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjectLinks.CreateView("Links", persistence, "#projectLinkTemplateContainer", linkTemplate, "#createProjectLink", false, vcProjects);
            let vcProjectTaskLinks = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjectTaskLinks.CreateView("Links", persistence, "#taskLinkTemplateContainer", linkTemplate, "#createTaskLink", false, vcProjectTasks);
            let vcProjectNotes = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjectNotes.CreateView("Notes", persistence, "#projectNoteTemplateContainer", noteTemplate, "#createProjectNote", false, vcProjects);
            let vcProjectTaskNotes = new EntityViewController_1.EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
            vcProjectTaskNotes.CreateView("Notes", persistence, "#taskNoteTemplateContainer", noteTemplate, "#createTaskNote", false, vcProjectTasks);
            let menuBar = [
                { displayName: "Bugs", viewController: vcProjectBugs },
                { displayName: "Contacts", viewController: vcProjectContacts },
                { displayName: "Project Notes", viewController: vcProjectNotes },
                { displayName: "Project Links", viewController: vcProjectLinks },
                { displayName: "Tasks", viewController: vcProjectTasks },
                { displayName: "Task Notes", viewController: vcProjectTaskNotes },
                { displayName: "Task Links", viewController: vcProjectTaskLinks },
                { displayName: "Sub-Tasks", viewController: vcSubtasks }
            ];
            let menuBarView = new MenuBarViewController_1.MenuBarViewController(menuBar, eventRouter);
            menuBarView.DisplayMenuBar("#menuBar");
        }
    }
    exports.AppMain = AppMain;
    ;
});
//# sourceMappingURL=AppMain.js.map