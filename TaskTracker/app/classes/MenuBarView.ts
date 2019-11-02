import { Helpers } from "./Helpers"
import { EventRouter } from "./EventRouter"
import { MenuBar } from "../interfaces/MenuBar"
import { MenuBarItem } from "../interfaces/MenuBarItem"
import { ViewController } from "./ViewController";

export class MenuBarView {
    private menuBar: MenuBar;
    private eventRouter: EventRouter;

    constructor(menuBar: MenuBar, eventRouter: EventRouter) {
        this.menuBar = menuBar;
        this.eventRouter = eventRouter;
        let me = this;

        this.eventRouter.AddRoute("MenuBarShowSections", (_, __, vc:ViewController) => me.ShowSections(vc));
        this.eventRouter.AddRoute("MenuBarHideSections", (_, __, vc: ViewController) => me.HideSections(vc));
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
                    let visible = item.viewController.ToggleVisibility();

                    if (visible) {
                        jQuery(item.id).addClass("menuBarItemSelected");
                        item.selected = true;
                        this.ShowSections(item.viewController);
                    } else {
                        jQuery(item.id).removeClass("menuBarItemSelected");
                        item.selected = false;
                        this.HideSections(item.viewController);
                    }
                });
            });
        });
    }

    private ShowSections(vc: ViewController): void {
        vc.childControllers.forEach(vcChild => {
            this.menuBar.forEach(item => {
                if (item.selected && vcChild == item.viewController) {
                    item.viewController.ShowView();
                }
            });

            this.ShowSections(vcChild);
        });
    }

    private HideSections(vc: ViewController): void {
        vc.childControllers.forEach(vcChild => {
            this.menuBar.forEach(item => {
                if (item.selected && vcChild == item.viewController) {
                    item.viewController.HideView();
                }
            });

            this.HideSections(vcChild);
        });
    }
}
