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
        Route(routeName, store, idx, builder) {
            return this.routes[routeName](store, idx, builder);
        }
    }
    exports.EventRouter = EventRouter;
});
//# sourceMappingURL=EventRouter.js.map