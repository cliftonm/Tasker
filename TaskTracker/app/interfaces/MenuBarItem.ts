import { EntityViewController } from "../classes/EntityViewController"

export interface MenuBarItem {
    displayName: string;
    viewController: EntityViewController;
    initiallyVisible?: boolean;
    id?: string;         // used internally, never set
    selected?: boolean;  // used internally, never set
}

