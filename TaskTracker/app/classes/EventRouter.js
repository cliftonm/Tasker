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
        Route(routeName, store, idx) {
            return this.routes[routeName](store, idx);
        }
    }
    exports.EventRouter = EventRouter;
});
//# sourceMappingURL=EventRouter.js.map