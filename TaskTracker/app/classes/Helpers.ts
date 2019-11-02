export class Helpers {
    public static ReplaceAll(str: string, orig: string, repl: string) : string {
        return str.split(orig).join(repl);
    }
}