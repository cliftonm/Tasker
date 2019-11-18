import { Helpers } from "./Helpers"
import { EventRouter } from "./EventRouter"
import { StoreManager } from "./StoreManager"
import { MenuBar } from "../interfaces/MenuBar"
import { MenuBarItem } from "../interfaces/MenuBarItem"
import { EntityViewController } from "./EntityViewController";

export class MenuBarViewController {
    private menuBar: MenuBar;
    private eventRouter: EventRouter;
    private storeManager: StoreManager;

    constructor(menuBar: MenuBar, eventRouter: EventRouter, storeManager: StoreManager) {
        this.menuBar = menuBar;
        this.eventRouter = eventRouter;
        this.storeManager = storeManager;

        // TODO: Rename Show/Hide Sections to Show/Hide Child Entities.
        this.eventRouter.AddRoute("MenuBarShowSections", (_, __, vc:EntityViewController) => this.ShowSections(vc));
        this.eventRouter.AddRoute("MenuBarHideSections", (_, __, vc: EntityViewController) => this.HideSections(vc));
        this.eventRouter.AddRoute("DeselectAll", (_, __, ___) => this.DeselectAll());
    }

    public DisplayMenuBar(containerId: string) {
        let containerHtml = "";

        this.menuBar.forEach(item => {
            let html = this.CreateMenuBarItem(item);
            containerHtml += html;
        });

        jQuery(containerId).append(containerHtml);
        this.WireUpEventHandlers();
    }

    private CreateMenuBarItem(item: MenuBarItem): string {
        let id = Helpers.ReplaceAll(item.displayName, " ", "") + "ID";
        item.id = "#" + id;
        let showAllId = id + "ShowAll";
        item.showAllId = "#" + showAllId;
        let classes = "menuBarItem";
        let showAllButton = "";

        if (item.initiallyVisible) {
            classes = classes + " menuBarItemSelected";
            item.selected = true;
        }

        if (item.showAll) {
            showAllButton = `<button id='${showAllId}' class='menuBarItemShowAll'>*</button>`;
        }

        let html = `<div><button type="button" id="${id}" class="${classes}">${item.displayName}</button>${showAllButton}</div>`;

        return html;
    }

    private WireUpEventHandlers(): void {
        jQuery(document).ready(() => {
            this.menuBar.forEach(item => {
                jQuery(item.id).on('click', () => {
                    let visible = item.viewController.ToggleVisibility();
                    visible ? this.SelectItem(item) : this.DeselectItem(item);
                });

                jQuery(item.showAllId).on('click', () => {
                    this.DeselectAll();
                    item.viewController.ShowAllRecords();
                    jQuery(item.id).addClass("menuBarItemSelected");
                    item.selected = true;
                    //let store = this.storeManager.GetStore(item.storeName);
                    // this.eventRouter.Route("ShowAllEntities", store, 0, item.viewController);
                });
            });
        });
    }

    private ShowSections(vc: EntityViewController): void {
        vc.childControllers.forEach(vcChild => {
            this.menuBar.forEach(item => {
                if (item.selected && vcChild == item.viewController) {
                    item.viewController.ShowView();
                }
            });

            this.ShowSections(vcChild);
        });
    }

    private HideSections(vc: EntityViewController): void {
        vc.childControllers.forEach(vcChild => {
            this.menuBar.forEach(item => {
                if (item.selected && vcChild == item.viewController) {
                    item.viewController.HideView();
                }
            });

            this.HideSections(vcChild);
        });
    }

    private DeselectAll(): void {
        this.menuBar.forEach(item => {
            if (item.selected) {
                this.DeselectItem(item);
                item.viewController.ToggleVisibility();
            }
        });
    }

    private SelectItem(item: MenuBarItem): void {
        jQuery(item.id).addClass("menuBarItemSelected");
        item.selected = true;
        this.ShowSections(item.viewController);
    }

    private DeselectItem(item: MenuBarItem): void {
        jQuery(item.id).removeClass("menuBarItemSelected");
        item.selected = false;
        this.HideSections(item.viewController);
    }
}
