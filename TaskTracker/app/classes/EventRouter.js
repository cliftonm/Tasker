define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EventRouter {
        constructor() {
            this.routes = {};
        }
        AddRoute(routeName, fnc) {
            this.routes[routeName] = fnc;
        }
        Route(routeName, store, idx, viewController) {
            return this.routes[routeName](store, idx, viewController);
        }
    }
    exports.EventRouter = EventRouter;
});
//# sourceMappingURL=EventRouter.js.map