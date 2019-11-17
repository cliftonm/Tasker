import { EntityViewController } from "../classes/EntityViewController"
import { Store } from "../classes/Store"

export interface MenuBarItem {
    displayName: string;
    viewController: EntityViewController;
    initiallyVisible?: boolean;
    showAll?: boolean;
    storeName?: string;
    id?: string;            // used internally, never set
    showAllId?: string;     // used internally, never set
    selected?: boolean;     // used internally, never set
}

