import * as libs from "libs";

interface Window {
    cv: typeof import("mirada/dist/src/types/opencv/_types");
}

export { Window, libs };
