const isLocalAccessApp = (): boolean =>
    typeof window !== "undefined" && window.location.hostname === "access.app";

const localDefaults = {
    production: false,
    baseUrl: "/",
    apiUrl: "http://localhost:3001",
    appUrl: "https://staging.verifik.co",
    kycUrl: "http://localhost:4200",
    verifikProject: "6266193db77ccc8111730c90",
    stagingUrl: "https://staging.verifik.co",
    sandboxUrl: "https://staging.verifik.co",
    sandboxProject: "6266193db77ccc8111730c90",
    forceCameraQualityModal: false,
    allowDevFaceFileUpload: false,
    smartAgentBridgeUrl: "https://staging.verifik.co/bridge",
};

const accessAppOverrides = {
    apiUrl: "https://access.app",
    appUrl: "https://verifik.app",
    kycUrl: "https://access.app",
    smartAgentBridgeUrl: "https://verifik.app/bridge",
};

export const environment = new Proxy(localDefaults, {
    get(target, prop, receiver) {
        if (isLocalAccessApp() && prop in accessAppOverrides) {
            return Reflect.get(accessAppOverrides, prop, receiver);
        }
        return Reflect.get(target, prop, receiver);
    },
});
