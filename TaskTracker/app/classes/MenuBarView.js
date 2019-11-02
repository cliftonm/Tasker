define(["require", "exports", "./Helpers"], function (require, exports, Helpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MenuBarView {
        constructor(menuBar, eventRouter) {
            this.menuBar = menuBar;
            this.eventRouter = eventRouter;
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
            let html = `<div><button type="button" id="${id}" class="menuBarItem">${item.displayName}</button></div>`;
            return html;
        }
        WireUpEventHandlers() {
            jQuery(document).ready(() => {
                this.menuBar.forEach(item => {
                    jQuery(item.id).on('click', () => {
                        item.viewController.ToggleVisibility();
                    });
                });
            });
        }
    }
    exports.MenuBarView = MenuBarView;
});
//# sourceMappingURL=MenuBarView.js.map