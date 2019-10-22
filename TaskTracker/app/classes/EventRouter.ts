import { TemplateBuilder } from "../classes/TemplateBuilder"
import { Store } from "../classes/Store"
import { RouteHandlerMap } from "../interfaces/RouteHandlerMap"

export class EventRouter {
    routes: RouteHandlerMap = {};

    public AddRoute(routeName: string, fnc: (store: Store, idx: number, builder: TemplateBuilder) => void) {
        this.routes[routeName] = fnc;
    }

    public Route(routeName: string, store: Store, idx: number, builder: TemplateBuilder): any {
        return this.routes[routeName](store, idx, builder);
    }
}