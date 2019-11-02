import { Helpers } from "./Helpers"
import { EventRouter } from "./EventRouter"
import { MenuBar } from "../interfaces/MenuBar"
import { MenuBarItem } from "../interfaces/MenuBarItem"

export class MenuBarView {
    private menuBar: MenuBar;
    private eventRouter: EventRouter;

    constructor(menuBar: MenuBar, eventRouter: EventRouter) {
        this.menuBar = menuBar;
        this.eventRouter = eventRouter;
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
        let html = `<div><button type="button" id="${id}" class="menuBarItem">${item.displayName}</button></div>`;

        return html;
    }

    private WireUpEventHandlers(): void {
        jQuery(document).ready(() => {
            this.menuBar.forEach(item => {
                jQuery(item.id).on('click', () => {
                    item.viewController.ToggleVisibility();
                });
            });
        });
    }
}
