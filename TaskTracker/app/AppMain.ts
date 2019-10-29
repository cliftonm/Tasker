// Sort of works, I get "Cannot read property 'default' of undefined"
// import * as jQuery from "../lib/jquery"

// We lose intellisense doing this:
// const $ = jQuery;

// However, using $, we don't get intellisense, but using jQuery, we do.

import { ViewController } from "./classes/ViewController"
import { StoreManager } from "./classes/StoreManager"
import { ParentChildStore } from "./stores/ParentChildStore"
import { AuditLogStore } from "./stores/AuditLogStore"
import { EventRouter } from "./classes/EventRouter"
import { SequenceStore } from "./stores/SequenceStore";
import { CloudPersistence } from "./classes/CloudPersistence";
import { LocalStoragePersistence } from "./classes/LocalStoragePersistence";

// Add bugs and meetings

export class AppMain {
    public run() {
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
            { field: "Status", storeName: "BugStatusList", orderBy: "StatusOrder", line: 0, width: "20%", control: "combobox"},
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

        let storeManager = new StoreManager();
        let persistence = new LocalStoragePersistence();
        // let persistence = new CloudPersistence("http://127.0.0.1/");

        let auditLogStore = new AuditLogStore(storeManager, persistence, "AuditLogStore", undefined);
        storeManager.RegisterStore(auditLogStore);
        auditLogStore.Load();

        let seqStore = new SequenceStore(storeManager, persistence, "Sequences", auditLogStore);
        storeManager.RegisterStore(seqStore);
        seqStore.Load();
        storeManager.getPrimaryKeyCallback = (storeName: string) => {
            return { __ID: seqStore.GetNext(storeName) };
        }

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
        });

        eventRouter.AddRoute("CreateRecord", (store, idx, viewController) => store.CreateRecord(true, viewController));

        let vcProjects = new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore);
        vcProjects.CreateStoreViewFromTemplate("Projects", persistence, "#projectTemplateContainer", projectTemplate, "#createProject", true, undefined, (idx, store) => store.SetDefault(idx, "Status", projectStates[0].text));

        let vcBugs = new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore);
        vcBugs.CreateStoreViewFromTemplate("Bugs", localStoragePersistence, "#projectBugTemplateContainer", bugTemplate, "#createProjectBug", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", bugStates[0].text));
        new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Notes", localStoragePersistence, "#bugNoteTemplateContainer", noteTemplate, "#createBugNote", false, vcBugs);

        let vcTasks = new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore);
        vcTasks.CreateStoreViewFromTemplate("Tasks", persistence, "#projectTaskTemplateContainer", taskTemplate, "#createTask", false, vcProjects, (idx, store) => store.SetDefault(idx, "Status", taskStates[0].text));

        new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Tasks", persistence, "#taskTaskTemplateContainer", taskTemplate, "#createSubtask", false, vcTasks);

        new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Contacts", persistence, "#projectContactTemplateContainer", contactTemplate, "#createProjectContact", false, vcProjects);

        new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Links", persistence, "#projectLinkTemplateContainer", linkTemplate, "#createProjectLink", false, vcProjects);
        new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Links", persistence, "#taskLinkTemplateContainer", linkTemplate, "#createTaskLink", false, vcTasks);

        new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Notes", persistence, "#projectNoteTemplateContainer", noteTemplate, "#createProjectNote", false, vcProjects);
        new ViewController(storeManager, parentChildRelationshipStore, eventRouter, auditLogStore).CreateStoreViewFromTemplate("Notes", persistence, "#taskNoteTemplateContainer", noteTemplate, "#createTaskNote", false, vcTasks);
    }
};

