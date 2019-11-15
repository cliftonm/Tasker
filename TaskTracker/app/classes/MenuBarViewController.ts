﻿import { Helpers } from "./Helpers"
import { EventRouter } from "./EventRouter"
import { MenuBar } from "../interfaces/MenuBar"
import { MenuBarItem } from "../interfaces/MenuBarItem"
import { EntityViewController } from "./EntityViewController";

export class MenuBarViewController {
    private menuBar: MenuBar;
    private eventRouter: EventRouter;

    constructor(menuBar: MenuBar, eventRouter: EventRouter) {
        this.menuBar = menuBar;
        this.eventRouter = eventRouter;

        this.eventRouter.AddRoute("MenuBarShowSections", (_, __, vc:EntityViewController) => this.ShowSections(vc));
        this.eventRouter.AddRoute("MenuBarHideSections", (_, __, vc: EntityViewController) => this.HideSections(vc));
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
        let classes = "menuBarItem";

        if (item.initiallyVisible) {
            classes = classes + " menuBarItemSelected";
        }

        let html = `<div><button type="button" id="${id}" class="${classes}">${item.displayName}</button></div>`;

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
}
