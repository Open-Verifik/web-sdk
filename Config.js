require('dotenv').config()

export var Config = (function () {

    var DeviceKeyIdentifier = process.env.DEVICE_KEY;

    var token = process.env.TOKEN;//TOKEN
   
    var BaseURL = process.env.URL;

    var PublicFaceScanEncryptionKey =
        "-----BEGIN PUBLIC KEY-----\n" +
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5PxZ3DLj+zP6T6HFgzzk\n" +
        "M77LdzP3fojBoLasw7EfzvLMnJNUlyRb5m8e5QyyJxI+wRjsALHvFgLzGwxM8ehz\n" +
        "DqqBZed+f4w33GgQXFZOS4AOvyPbALgCYoLehigLAbbCNTkeY5RDcmmSI/sbp+s6\n" +
        "mAiAKKvCdIqe17bltZ/rfEoL3gPKEfLXeN549LTj3XBp0hvG4loQ6eC1E1tRzSkf\n" +
        "GJD4GIVvR+j12gXAaftj3ahfYxioBH7F7HQxzmWkwDyn3bqU54eaiB7f0ftsPpWM\n" +
        "ceUaqkL2DZUvgN0efEJjnWy5y1/Gkq5GGWCROI9XG/SwXJ30BbVUehTbVcD70+ZF\n" +
        "8QIDAQAB\n" +
        "-----END PUBLIC KEY-----";

    function initializeFromAutogeneratedConfig(FaceTecSDK, callback) {
        FaceTecSDK.initializeInProductionMode(`{
            "domains": ${process.env.DOMAINS},
            "expiryDate": "2023-02-10",
            "key": ${process.env.PRODUCTION_KEY}
          }`, this.DeviceKeyIdentifier, this.PublicFaceScanEncryptionKey,
            function (initializedSuccessfully) {
                callback(initializedSuccessfully);
            });
    };

    function retrieveConfigurationWizardCustomization(FaceTecSDK) {
        var defaultCustomization = new FaceTecSDK.FaceTecCustomization();
        this.currentCustomization = defaultCustomization;
        return defaultCustomization;
    };

    function retrieveLowLightConfigurationWizardCustomization(FaceTecSDK) {
        var defaultCustomization = new FaceTecSDK.FaceTecCustomization();
        this.currentLowLightCustomization = defaultCustomization;
        return defaultCustomization;
    };

    function retrieveDynamicDimmingConfigurationWizardCustomization(FaceTecSDK) {
        var defaultCustomization = new FaceTecSDK.FaceTecCustomization();
        this.currentDynamicDimmingCustomization = defaultCustomization;
        return defaultCustomization;
    };

    var currentCustomization;
    var currentLowLightCustomization;
    var currentDynamicDimmingCustomization;

    var wasSDKConfiguredWithConfigWizard = false;

    return {
        token,
        wasSDKConfiguredWithConfigWizard,
        DeviceKeyIdentifier,
        BaseURL,
        PublicFaceScanEncryptionKey,
        initializeFromAutogeneratedConfig,
        currentCustomization,
        currentLowLightCustomization,
        currentDynamicDimmingCustomization,
        retrieveConfigurationWizardCustomization,
        retrieveLowLightConfigurationWizardCustomization,
        retrieveDynamicDimmingConfigurationWizardCustomization
    };

})();