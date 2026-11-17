import * as libs from "libs";

export type Mat = any;

interface Window {
    cv: any;
}

declare module "qrcode";

export { Window, libs };
