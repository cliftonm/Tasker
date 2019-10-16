define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EventRouter {
        constructor() {
            this.routes = {};
        }
        AddRoute(name, fnc) {
            this.routes[name] = fnc;
        }
    }
    exports.EventRouter = EventRouter;
});
//# sourceMappingURL=EventRouter.js.map