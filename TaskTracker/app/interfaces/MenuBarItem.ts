import { ViewController } from "../classes/ViewController"

export interface MenuBarItem {
    displayName: string;
    viewController: ViewController;
    id?: string;         // used internally, never set
    selected?: boolean;  // used internally, never set
}

