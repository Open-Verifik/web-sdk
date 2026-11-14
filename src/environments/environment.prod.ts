const sandboxKycUrl = (): string => {
    if (typeof window === "undefined") return "https://access.verifik.co";

    const hostname = window.location.hostname;

    if (hostname.includes("staging-access.verifik.co")) return "https://staging-access.verifik.co";

    if (hostname.includes("sandbox-auth.verifik.co")) return "https://sandbox-auth.verifik.co";

    return "https://access.verifik.co";
};

export const environment = {
    production: true,
    baseUrl: "/",
    apiUrl: "",
    appUrl: "https://app.verifik.co",
    get kycUrl(): string {
        return sandboxKycUrl();
    },
    verifikProject: "6332941ccde4f719d9c00f9e",
    stagingUrl: "https://staging.verifik.co",
    sandboxUrl: "https://staging.verifik.co",
    sandboxProject: "6266193db77ccc8111730c90",
    forceCameraQualityModal: false,
    allowDevFaceFileUpload: false,
    smartAgentBridgeUrl: "https://ai.verifik.co/bridge",
};
