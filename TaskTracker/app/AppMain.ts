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

import { EntityViewController } from "./classes/EntityViewController"
import { StoreManager } from "./classes/StoreManager"
import { ParentChildStore } from "./stores/ParentChildStore"
import { AuditLogStore } from "./stores/AuditLogStore"
import { EventRouter } from "./classes/EventRouter"
import { SequenceStore } from "./stores/SequenceStore";
import { CloudPersistence } from "./classes/CloudPersistence";
import { MenuBarViewController } from "./classes/MenuBarViewController";
import { Guid } from "./classes/Guid";
import { Relationship } from "./interfaces/Relationship";
import { LocalStoragePersistence } from "./classes/LocalStoragePersistence";
import { Justification } from "./enums/Justification"

// Add bugs and meetings

export class AppMain {
    public run() {
        const relationships = [
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

        const projectTemplate = [
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

        const taskTemplate = [
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

        const noteTemplate = [
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

        const contactTemplate = [
            { field: "Name", line: 0, width: "30%", control: "textbox" },
            { field: "Email", line: 0, width: "30%", control: "textbox" },
            { field: "Title", line: 0, width: "30%", control: "textbox" },
            { line: 1, width: "10%", control: "label", label: "Work:", justification: Justification.Right },
            { field: "Work Phone", line: 1, width: "35%", control: "textbox" },
            { line: 1, width: "10%", control: "label", label: "Cell:", justification: Justification.Right  },
            { field: "Cell Phone", line: 1, width: "35%", control: "textbox" },
            { field: "Comment", line: 2, width: "80%", control: "textbox" },
            { text: "Delete", line: 2, width: "80px", control: "button", route: "DeleteRecord" }
        ];

        const linkTemplate = [
            { field: "Description", line: 0, width: "20%", control: "textbox" },
            { field: "URL", line: 0, width: "40%", control: "textbox" },
            { text: "Delete", line: 0, width: "80px", control: "button", route: "DeleteRecord" }
        ];

        const bugTemplate = [
            { field: "Description", line: 0, width: "70%", control: "textbox" },
            { field: "Status", storeName: "BugStatusList", orderBy: "StatusOrder", line: 0, width: "20%", control: "combobox"},
            { field: "Resolution", line: 0, width: "70%", control: "textarea" },
            { text: "Delete", line: 0, width: "80px", control: "button", route: "DeleteRecord" }
        ];

        const projectStates = [
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

        const taskStates = [
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

        const bugStates = [
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

        const userId = new Guid("00000000-0000-0000-0000-00000000000C");
        let storeManager = new StoreManager();

        //let persistence = new LocalStoragePersistence();
        //let cloudPersistence = new CloudPersistence("http://127.0.0.1/", userId, storeManager);

        let persistence = new CloudPersistence("http://127.0.0.1/", userId, storeManager);
        let cloudPersistence = undefined;

        let auditLogStore = new AuditLogStore(storeManager, persistence, "AuditLogStore");
        storeManager.RegisterStore(auditLogStore);

        persistence.SetAuditLogStore(auditLogStore);
        persistence.LoadAuditLog();

        let seqStore = new SequenceStore(storeManager, persistence, "Sequences", auditLogStore);
        storeManager.RegisterStore(seqStore);
        seqStore.Load();
        storeManager.getNextPrimaryKeyCallback = (storeName: string) => { return { __ID: seqStore.GetNext(storeName) }; }

        storeManager.AddInMemoryStore("ProjectStatusList", projectStates);
        storeManager.AddInMemoryStore("TaskStatusList", taskStates);
        storeManager.AddInMemoryStore("BugStatusList", bugStates);

        let parentChildRelationshipStore = new ParentChildStore(storeManager, persistence, "ParentChildRelationships", auditLogStore);
        storeManager.RegisterStore(parentChildRelationshipStore);
        parentChildRelationshipStore.Load();

        let eventRouter = new EventRouter();
        eventRouter.AddRoute("DeleteRecord", (store, idx, viewController) => {
            store.DeleteRecord(idx, viewController);
            store.Save();
            viewController.ShowAllRecords();
        });

        eventRouter.AddRoute("CreateRecord", (store, idx, viewController) => store.CreateRecord(true, viewController));

        let vcProjects = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjects.CreateView("Projects", persistence, "#projectTemplateContainer", projectTemplate, "#createProject", true, undefined, (idx, store) => store.SetDefault(idx, "Status", projectStates[0].text));

        let vcProjectBugs = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjectBugs.CreateView("Bugs", persistence, "#projectBugTemplateContainer", bugTemplate, "#createProjectBug", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", bugStates[0].text));

        let vcBugNotes = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcBugNotes.CreateView("Notes", persistence, "#bugNoteTemplateContainer", noteTemplate, "#createBugNote", false, vcProjectBugs);

        let vcProjectTasks = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjectTasks.CreateView("Tasks", persistence, "#projectTaskTemplateContainer", taskTemplate, "#createTask", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", taskStates[0].text));

        let vcSubtasks = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcSubtasks.CreateView("Tasks", persistence, "#taskTaskTemplateContainer", taskTemplate, "#createSubtask", false, vcProjectTasks);

        let vcProjectContacts = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjectContacts.CreateView("Contacts", persistence, "#projectContactTemplateContainer", contactTemplate, "#createProjectContact", false, vcProjects);

        let vcProjectLinks = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjectLinks.CreateView("Links", persistence, "#projectLinkTemplateContainer", linkTemplate, "#createProjectLink", false, vcProjects);

        let vcProjectTaskLinks = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjectTaskLinks.CreateView("Links", persistence, "#taskLinkTemplateContainer", linkTemplate, "#createTaskLink", false, vcProjectTasks);

        let vcProjectNotes = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjectNotes.CreateView("Notes", persistence, "#projectNoteTemplateContainer", noteTemplate, "#createProjectNote", false, vcProjects);

        let vcProjectTaskNotes = new EntityViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore, relationships);
        vcProjectTaskNotes.CreateView("Notes", persistence, "#taskNoteTemplateContainer", noteTemplate, "#createTaskNote", false, vcProjectTasks);

        const menuBar = [
            { displayName: "Bugs", viewController: vcProjectBugs },
            { displayName: "Contacts", viewController: vcProjectContacts },
            { displayName: "Project Notes", viewController: vcProjectNotes },
            { displayName: "Project Links", viewController: vcProjectLinks },
            { displayName: "Tasks", viewController: vcProjectTasks },
            { displayName: "Task Notes", viewController: vcProjectTaskNotes },
            { displayName: "Task Links", viewController: vcProjectTaskLinks },
            { displayName: "Sub-Tasks", viewController: vcSubtasks }
        ];

        let menuBarView = new MenuBarViewController(menuBar, eventRouter);
        menuBarView.DisplayMenuBar("#menuBar");

        let entities = this.GetEntities(relationships);

        jQuery("#mnuExportChanges").on('click', () => cloudPersistence.Export(auditLogStore));

        // TODO: We should disable the export button until all the AJAX calls complete.
        jQuery("#mnuExportAllStores").on('click', () => cloudPersistence.ExportAll(entities));
    }

    // Gets the list of entities from the relationships hierarchy.
    // We assume that the store name == entity name!!!
    private GetEntities(relationships: Relationship[]): string[] {
        let entities = [];

        relationships.forEach(r => {
            entities.push(r.parent);
            r.children.forEach(c => entities.push(c));
        });

        let distinctEntities = [...new Set(entities)];

        return distinctEntities;
    }
};

