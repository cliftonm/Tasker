import { AppMain } from "./AppMain"

require(['AppMain'],
    (main: any) => {
        var appMain = new AppMain();
        appMain.run();
    }
);
