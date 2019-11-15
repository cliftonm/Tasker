define(["require", "exports", "./Helpers"], function (require, exports, Helpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MenuBarViewController {
        constructor(menuBar, eventRouter) {
            this.menuBar = menuBar;
            this.eventRouter = eventRouter;
            this.eventRouter.AddRoute("MenuBarShowSections", (_, __, vc) => this.ShowSections(vc));
            this.eventRouter.AddRoute("MenuBarHideSections", (_, __, vc) => this.HideSections(vc));
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
            let classes = "menuBarItem";
            if (item.initiallyVisible) {
                classes = classes + " menuBarItemSelected";
            }
            let html = `<div><button type="button" id="${id}" class="${classes}">${item.displayName}</button></div>`;
            return html;
        }
        WireUpEventHandlers() {
            jQuery(document).ready(() => {
                this.menuBar.forEach(item => {
                    jQuery(item.id).on('click', () => {
                        let visible = item.viewController.ToggleVisibility();
                        if (visible) {
                            jQuery(item.id).addClass("menuBarItemSelected");
                            item.selected = true;
                            this.ShowSections(item.viewController);
                        }
                        else {
                            jQuery(item.id).removeClass("menuBarItemSelected");
                            item.selected = false;
                            this.HideSections(item.viewController);
                        }
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
    }
    exports.MenuBarViewController = MenuBarViewController;
});
//# sourceMappingURL=MenuBarViewController.js.map