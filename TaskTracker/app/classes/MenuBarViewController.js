define(["require", "exports", "./Helpers"], function (require, exports, Helpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MenuBarViewController {
        constructor(menuBar, eventRouter, storeManager) {
            this.menuBar = menuBar;
            this.eventRouter = eventRouter;
            this.storeManager = storeManager;
            // TODO: Rename Show/Hide Sections to Show/Hide Child Entities.
            this.eventRouter.AddRoute("MenuBarShowSections", (_, __, vc) => this.ShowSections(vc));
            this.eventRouter.AddRoute("MenuBarHideSections", (_, __, vc) => this.HideSections(vc));
            this.eventRouter.AddRoute("DeselectAll", (_, __, ___) => this.DeselectAll());
        }
        DisplayMenuBar(containerId) {
            let containerHtml = "";
            this.menuBar.forEach(item => {
                let html = this.CreateMenuBarItem(item);
                containerHtml += html;
            });
            jQuery(containerId).append(containerHtml);
            this.WireUpEventHandlers();
        }
        CreateMenuBarItem(item) {
            let id = Helpers_1.Helpers.ReplaceAll(item.displayName, " ", "") + "ID";
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
        WireUpEventHandlers() {
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
        ShowSections(vc) {
            vc.childControllers.forEach(vcChild => {
                this.menuBar.forEach(item => {
                    if (item.selected && vcChild == item.viewController) {
                        item.viewController.ShowView();
                    }
                });
                this.ShowSections(vcChild);
            });
        }
        HideSections(vc) {
            vc.childControllers.forEach(vcChild => {
                this.menuBar.forEach(item => {
                    if (item.selected && vcChild == item.viewController) {
                        item.viewController.HideView();
                    }
                });
                this.HideSections(vcChild);
            });
        }
        DeselectAll() {
            this.menuBar.forEach(item => {
                if (item.selected) {
                    this.DeselectItem(item);
                    item.viewController.ToggleVisibility();
                }
            });
        }
        SelectItem(item) {
            jQuery(item.id).addClass("menuBarItemSelected");
            item.selected = true;
            this.ShowSections(item.viewController);
        }
        DeselectItem(item) {
            jQuery(item.id).removeClass("menuBarItemSelected");
            item.selected = false;
            this.HideSections(item.viewController);
        }
    }
    exports.MenuBarViewController = MenuBarViewController;
});
//# sourceMappingURL=MenuBarViewController.js.map