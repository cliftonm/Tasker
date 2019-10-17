import { Store } from "../classes/Store"

export interface RouteHandlerMap
{
    [route: string]: (store: Store, idx: number) => any;
}
                       