export class Guid {
    private guid: string;

    constructor(guid: string) {
        this.guid = guid;
    }

    public ToString(): string {
        return this.guid;
    }

    static NewGuid(): Guid {
        var result: string;
        var i: string;
        var j: number;

        result = "";

        for (j = 0; j < 32; j++) {
            if (j == 8 || j == 12 || j == 16 || j == 20) {
                result = result + '-';
            }

            i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
            result = result + i;
        }

        return new Guid(result);
    }
}