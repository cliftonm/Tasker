import { ViewController } from "../classes/ViewController"
import { Store } from "../classes/Store"
import { RouteHandlerMap } from "../interfaces/RouteHandlerMap"

export class EventRouter {
    routes: RouteHandlerMap = {};

    public AddRoute(routeName: string, fnc: (store: Store, idx: number, viewController: ViewController) => void) {
        this.routes[routeName] = fnc;
    }

    public Route(routeName: string, store: Store, idx: number, viewController: ViewController): any {
        return this.routes[routeName](store, idx, viewController);
    }
}