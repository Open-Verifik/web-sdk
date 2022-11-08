export var Config = (function () {

    var DeviceKeyIdentifier = "dSIbWmqD0mIiN3UU6wC1WrHO20v1dCKk";

    var token = "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjbGllbnRJZCI6IjYxM2EyOGVhNjRmYzQxNDBiZDhjNTFlMCIsImRvY3VtZW50VHlwZSI6IkNDIiwiZG9jdW1lbnROdW1iZXIiOiI0NTQ1NDU0MSIsInYiOjEsInJvbGUiOiJjbGllbnQiLCJzdWJzY3JpcHRpb25QbGFuIjpudWxsLCJpYXQiOjE2NjUxODc4MjV9.sDJI_OcNs2Uukqtm2r96JuVnA6MZJLHN1BrIA7xoOX8";//TOKEN
   
    var BaseURL = "https://staging-api.verifik.co/v2/biometrics";

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

    function initializeFromAutogeneratedConfig(VerifikSDK, callback) {
        VerifikSDK.initializeInProductionMode(`{
            "domains": "verifik.co,auth.verifik.co,kyc.verifik.co",
            "expiryDate": "2023-02-10",
            "key": "00304502203950844aad8dc700415a1553210e8ce87d02edda9b99d41c30fd6dfcc26d3eff022100b6b8cd11c04ec5a2fbcc2c5e280e87ea4d5ec7b29c25683cf98e718f317a785c"
          }`, this.DeviceKeyIdentifier, this.PublicFaceScanEncryptionKey,
            function (initializedSuccessfully) {
                callback(initializedSuccessfully);
            });
    };

    function retrieveConfigurationWizardCustomization(VerifikSDK) {
        var defaultCustomization = new VerifikSDK.FaceTecCustomization();
        this.currentCustomization = defaultCustomization;
        return defaultCustomization;
    };

    function retrieveLowLightConfigurationWizardCustomization(VerifikSDK) {
        var defaultCustomization = new VerifikSDK.FaceTecCustomization();
        this.currentLowLightCustomization = defaultCustomization;
        return defaultCustomization;
    };

    function retrieveDynamicDimmingConfigurationWizardCustomization(VerifikSDK) {
        var defaultCustomization = new VerifikSDK.FaceTecCustomization();
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