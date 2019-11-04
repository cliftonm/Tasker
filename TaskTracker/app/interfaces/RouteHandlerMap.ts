import { EntityViewController } from "../classes/EntityViewController"
import { Store } from "../classes/Store"

export interface RouteHandlerMap
{
    [route: string]: (store: Store, idx: number, viewController: EntityViewController) => any;
}
                       