import { Store } from "../classes/Store"
import { RouteHandlerMap } from "../interfaces/RouteHandlerMap"

export class EventRouter {
    routes: RouteHandlerMap = {};

    public AddRoute(name: string, fnc: (store: Store, idx: number) => void) {
        this.routes[name] = fnc;
    }
}