import { EntityViewController } from "./EntityViewController"
import { Store } from "../classes/Store"
import { RouteHandlerMap } from "../interfaces/RouteHandlerMap"

export class EventRouter {
    routes: RouteHandlerMap = {};

    public AddRoute(routeName: string, fnc: (store: Store, idx: number, viewController: EntityViewController) => void) {
        this.routes[routeName] = fnc;
    }

    public Route(routeName: string, store: Store, idx: number, viewController: EntityViewController): any {
        return this.routes[routeName](store, idx, viewController);
    }
}