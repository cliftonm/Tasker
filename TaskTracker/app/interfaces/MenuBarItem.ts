import { EntityViewController } from "../classes/EntityViewController"

export interface MenuBarItem {
    displayName: string;
    viewController: EntityViewController;
    id?: string;         // used internally, never set
    selected?: boolean;  // used internally, never set
}

