import {
    KycService
} from '../kyc/kyc.service';

import {
    FaceTecSDK
} from 'assets/biometricsV2/sdk/sdk';

import {
    textBiometrics
} from './biometrics.es';

import {
    BehaviorSubject,
    Observable
} from 'rxjs';

import {
    FaceTecFaceScanProcessor,
    FaceTecFaceScanResultCallback,
    FaceTecIDScanNextStep,
    FaceTecIDScanProcessor,
    FaceTecIDScanResult,
    FaceTecIDScanResultCallback,
    FaceTecSessionResult
} from 'assets/biometricsV2/sdk/FaceTecPublicApi';

const cacheKeys = ['ft.fsh', 'ft.ic', 'zoom.installationID', 'zoom.lk']

export class BiometricV2 {
    private _session: BehaviorSubject < boolean > = new BehaviorSubject(null);
    get session$(): Observable < boolean > {
        return this._session.asObservable();
    }

    private _auth: BehaviorSubject < any > = new BehaviorSubject(null);
    get auth$(): Observable < any > {
        return this._auth.asObservable();
    }

    private _liveness: BehaviorSubject < any > = new BehaviorSubject(null);
    get liveness$(): Observable < any > {
        return this._liveness.asObservable();
    }

    private _onboardingBiometric: BehaviorSubject < any > = new BehaviorSubject(null);
    get onboardingBiometric$(): Observable < any > {
        return this._onboardingBiometric.asObservable();
    }

    private _onboardingScan: BehaviorSubject < any > = new BehaviorSubject(null);
    get onboardingScan$(): Observable < any > {
        return this._onboardingScan.asObservable();
    }

    private _error: BehaviorSubject < string > = new BehaviorSubject(null);
    get error$(): Observable < string > {
        return this._error.asObservable();
    }

    private _sessionToken: string;

    constructor(
        private _service: KycService,
        private callback: any
    ) {
        const status = FaceTecSDK.getStatus()

        if (!status) {
            this._loadConfig(callback);
            return this
        }
        setTimeout(() => callback(status), 100)
        return this
    }


    _loadConfig(callback: any): void {
        cacheKeys.forEach(key => {
            localStorage.removeItem(key)
        })

        this._service.getBiometricsV2().subscribe((response: any) => {
            const config: Array < any > = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

            FaceTecSDK.setResourceDirectory('/assets/biometricsV2/sdk/resources');
            FaceTecSDK.setImagesDirectory('/assets/biometricsV2/images');

            FaceTecSDK.initializeInProductionMode(config[0], config[1], config[2], (isBiometricLibReady) => {
                // console.group('==== Biometrics ====');
                // console.info("Lib", isBiometricLibReady)
                // console.groupEnd();

                if (isBiometricLibReady) {
                    this.setConfig()

                    const lang = localStorage.getItem('lang') || 'es'

                    if (lang == 'es') {
                        FaceTecSDK.configureLocalization(textBiometrics);
                    }
                }

                callback(isBiometricLibReady)
            });
        });
    }

    startSession() {
        const agent = FaceTecSDK.createFaceTecAPIUserAgentString('');

        this._service.getSessionV2(agent).subscribe((response: any) => {
            // console.group('==== Biometrics ====');
            // console.info("session")
            // console.groupEnd();
            this._sessionToken = response.data
            this._session.next(true);
        }, err => this._session.next(false))
    }

    startAuth(externalDatabaseRefId) {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }

        // console.group('==== Biometrics ====');
        // console.info("startAuth")
        // console.groupEnd();

        new BiometricProcessor({
            externalDatabaseRefId,
            type: 'login',
            token: this._sessionToken,
            callback: (error, response) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._auth.next(response)
            }
        }, this._service)
    }

    startLiveness() {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }

        // console.group('==== Biometrics ====');
        // console.info("startAuth")
        // console.groupEnd();

        new BiometricProcessor({
            type: 'liveness',
            token: this._sessionToken,
            callback: (error, response) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._liveness.next(response)
            }
        }, this._service)
    }

    startEnrollmentBiometrics(externalDatabaseRefId, group) {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }
        // console.group('==== Biometrics ====');
        // console.info("FaceScan")
        // console.groupEnd();

        new BiometricProcessor({
            externalDatabaseRefId,
            group,
            type: 'onboarding',
            token: this._sessionToken,
            callback: (error, response) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingBiometric.next(response);
            }
        }, this._service)
    }

    startEnrollmentDocument(externalDatabaseRefId) {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }

        // console.group('==== Biometrics ====');
        // console.info("DocumentScan")
        // console.groupEnd();

        new PhotoIDProcessor({
            externalDatabaseRefId,
            token: this._sessionToken,
            callback: (error, response) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingScan.next(response)
            }
        }, this._service)

    }

    startIdScan(externalDatabaseRefId) {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }

        // console.group('==== Biometrics ====');
        // console.info("DocumentScan")
        // console.groupEnd();

        new ScanIDProcessor({
            externalDatabaseRefId,
            token: this._sessionToken,
            callback: (error, response) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingScan.next(response)
            }
        }, this._service)

    }

    private setConfig(): void {
        const sdkImageDirectory = "/assets/biometricsV2/images/";

        // For Color Customization
        const outerBackgroundColor = "#f9f9ff";
        const frameColor = "#f9f9ff";
        const borderColor = "#e5ebfd";
        const ovalColor = "#1a4ae9";
        const dualSpinnerColor = "#00ffe0";
        const textColor = "#01236d";
        const buttonAndFeedbackBarColor = "#01236b";
        const buttonAndFeedbackBarTextColor = "#f9f9ff";
        const buttonColorHighlight = "#396E99";
        const buttonColorDisabled = "#335eec";

        // For Frame Corner Radius Customization
        let frameCornerRadius = "10px";

        // For Cancel Button Customization
        const cancelButtonImage = sdkImageDirectory + "FaceTec_cancel.png";
        const cancelButtonLocation = FaceTecSDK.FaceTecCancelButtonLocation.TopLeft;

        // For image Customization
        const yourAppLogoImage = sdkImageDirectory + "FaceTec_your_app_logo.png";
        const securityWatermarkImage = FaceTecSDK.FaceTecSecurityWatermarkImage.FaceTec_ZoOm;


        // Set a default customization
        const defaultCustomization = new FaceTecSDK.FaceTecCustomization();


        // Set Frame Customization
        defaultCustomization.frameCustomization.borderCornerRadius = frameCornerRadius;
        defaultCustomization.frameCustomization.backgroundColor = frameColor;
        defaultCustomization.frameCustomization.borderColor = borderColor;

        // Set Overlay Customization
        defaultCustomization.overlayCustomization.brandingImage = yourAppLogoImage;
        defaultCustomization.overlayCustomization.backgroundColor = outerBackgroundColor;

        // Set Guidance Customization
        defaultCustomization.guidanceCustomization.backgroundColors = frameColor;
        defaultCustomization.guidanceCustomization.foregroundColor = textColor;
        defaultCustomization.guidanceCustomization.buttonBackgroundNormalColor = buttonAndFeedbackBarColor;
        defaultCustomization.guidanceCustomization.buttonBackgroundDisabledColor = buttonColorDisabled;
        defaultCustomization.guidanceCustomization.buttonBackgroundHighlightColor = buttonColorHighlight;
        defaultCustomization.guidanceCustomization.buttonTextNormalColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.guidanceCustomization.buttonTextDisabledColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.guidanceCustomization.buttonTextHighlightColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.guidanceCustomization.retryScreenImageBorderColor = borderColor;
        defaultCustomization.guidanceCustomization.retryScreenOvalStrokeColor = borderColor;

        // Set Oval Customization
        defaultCustomization.ovalCustomization.strokeColor = ovalColor;
        defaultCustomization.ovalCustomization.progressColor1 = dualSpinnerColor;
        defaultCustomization.ovalCustomization.progressColor2 = dualSpinnerColor;

        // Set Feedback Customization
        defaultCustomization.feedbackCustomization.backgroundColor = buttonAndFeedbackBarColor;
        defaultCustomization.feedbackCustomization.textColor = buttonAndFeedbackBarTextColor;

        // Set Cancel Customization
        defaultCustomization.cancelButtonCustomization.customImage = cancelButtonImage;
        defaultCustomization.cancelButtonCustomization.location = cancelButtonLocation;

        // Set Security Watermark Customization
        defaultCustomization.securityWatermarkCustomization.setSecurityWatermarkImage(securityWatermarkImage);

        // Set Result Screen Customization
        defaultCustomization.resultScreenCustomization.backgroundColors = frameColor;
        defaultCustomization.resultScreenCustomization.foregroundColor = textColor;
        defaultCustomization.resultScreenCustomization.activityIndicatorColor = buttonAndFeedbackBarColor;
        defaultCustomization.resultScreenCustomization.resultAnimationBackgroundColor = buttonAndFeedbackBarColor;
        defaultCustomization.resultScreenCustomization.resultAnimationForegroundColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.resultScreenCustomization.uploadProgressFillColor = buttonAndFeedbackBarColor;

        // Set ID Scan Customization
        defaultCustomization.idScanCustomization.selectionScreenBackgroundColors = frameColor;
        defaultCustomization.idScanCustomization.selectionScreenForegroundColor = textColor;
        defaultCustomization.idScanCustomization.reviewScreenBackgroundColors = frameColor;
        defaultCustomization.idScanCustomization.reviewScreenForegroundColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.idScanCustomization.reviewScreenTextBackgroundColor = buttonAndFeedbackBarColor;
        defaultCustomization.idScanCustomization.captureScreenForegroundColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.idScanCustomization.captureScreenTextBackgroundColor = buttonAndFeedbackBarColor;
        defaultCustomization.idScanCustomization.buttonBackgroundNormalColor = buttonAndFeedbackBarColor;
        defaultCustomization.idScanCustomization.buttonBackgroundDisabledColor = buttonColorDisabled;
        defaultCustomization.idScanCustomization.buttonBackgroundHighlightColor = buttonColorHighlight;
        defaultCustomization.idScanCustomization.buttonTextNormalColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.idScanCustomization.buttonTextDisabledColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.idScanCustomization.buttonTextHighlightColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.idScanCustomization.captureScreenBackgroundColor = frameColor;
        defaultCustomization.idScanCustomization.captureFrameStrokeColor = borderColor;

        // Set Initial Loading Customization
        defaultCustomization.initialLoadingAnimationCustomization.backgroundColor = buttonAndFeedbackBarTextColor;
        defaultCustomization.initialLoadingAnimationCustomization.foregroundColor = buttonAndFeedbackBarColor;

        FaceTecSDK.setCustomization(defaultCustomization)
        return;
    };

}


const messageError = {
    [FaceTecSDK.FaceTecSessionStatus.CameraNotEnabled]: "Camera_error",
    [FaceTecSDK.FaceTecSessionStatus.CameraNotRunning]: "Camera_error",
    [FaceTecSDK.FaceTecSessionStatus.UserCancelled]: "Cancel_biometrics",
}


class configBiometricProcessor {
    externalDatabaseRefId ? : string
    group ? : string
    type ? : string
    token: string
    callback: any
}

class BiometricProcessor implements FaceTecFaceScanProcessor {
    error: any;
    token: any;
    success: boolean;
    response: any;

    constructor(private config: configBiometricProcessor, private _KycService: KycService) {
        new FaceTecSDK.FaceTecSession(
            this,
            config.token
        );
    }

    public processSessionResultWhileFaceTecSDKWaits(sessionResult: FaceTecSessionResult, faceScanResultCallback: FaceTecFaceScanResultCallback): void {
        FaceTecSDK.FaceTecSessionStatus
        if (sessionResult.status !== FaceTecSDK.FaceTecSessionStatus.SessionCompletedSuccessfully) {
            this.error = {
                message: messageError[sessionResult.status] ?? 'Session_end'
            }

            return faceScanResultCallback.cancel();
        }

        const parameters: any = {
            faceScan: sessionResult.faceScan,
            auditTrailImage: sessionResult.auditTrail[0],
            lowQualityAuditTrailImage: sessionResult.lowQualityAuditTrail[0],
            sessionId: sessionResult.sessionId,
            externalDatabaseRefID: this.config.externalDatabaseRefId,
        };

        if (this.config.group) {
            parameters.group = this.config.group
        }

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(sessionResult.sessionId as string);

        this.error = null
        this.token = null

        const _success = (response) => {
            this.response = response.data

            return faceScanResultCallback.proceedToNextStep(response.data.scanResultBlob);
        }

        const _errorCatch = (err) => {
            this.error = err.error;
            faceScanResultCallback.cancel()
        }

        switch (this.config.type) {
            case 'login':
                FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('Autenticado');
                this._KycService.authenticateV2(agent, parameters).subscribe(_success, _errorCatch);

                break;
            case 'onboarding':
                FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('Registro');
                this._KycService.enrollmentV2(agent, parameters).subscribe(_success, _errorCatch);

                break;
            case 'liveness':
                FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('Valido');
                this._KycService.livenessV2(agent, parameters).subscribe(_success, _errorCatch);
                break;

            default:
                break;
        }
    }

    public onFaceTecSDKCompletelyDone = () => {
        if (!this.response && !this.error) {
            this.error = {
                message: "BiometricValiation_failed"
            }
        }
        this.config.callback(this.error, this.response)
    }
}

class PhotoIDProcessor implements FaceTecFaceScanProcessor, FaceTecIDScanProcessor {
    latestSessionResult: FaceTecSessionResult | null;
    latestIDScanResult: FaceTecIDScanResult | null;

    success: boolean;

    FaceTecIDScanNextStep: FaceTecIDScanNextStep
    error: any;
    response: any;

    constructor(private config: configBiometricProcessor, private _KycService: KycService) {
        new FaceTecSDK.FaceTecSession(
            this,
            this.config.token
        );
    }

    public processSessionResultWhileFaceTecSDKWaits(sessionResult: FaceTecSessionResult, faceScanResultCallback: FaceTecFaceScanResultCallback): void {

        this.latestSessionResult = sessionResult;

        if (sessionResult.status !== FaceTecSDK.FaceTecSessionStatus.SessionCompletedSuccessfully) {
            this.error = {
                message: messageError[sessionResult.status] ?? 'Session_end'
            }

            return faceScanResultCallback.cancel();
        }

        const parameters: any = {
            faceScan: sessionResult.faceScan,
            auditTrailImage: sessionResult.auditTrail[0],
            lowQualityAuditTrailImage: sessionResult.lowQualityAuditTrail[0],
            sessionId: sessionResult.sessionId,
            externalDatabaseRefID: this.config.externalDatabaseRefId
        };

        if (this.config.group) {
            parameters.group = this.config.group
        }

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(sessionResult.sessionId as string);

        this.error = null

        const _success = (response) => {
            FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('Registro');
            return faceScanResultCallback.proceedToNextStep(response.data.scanResultBlob);
        }

        const _errorCatch = (err) => {
            this.error = err.error;
            faceScanResultCallback.cancel()
        }

        this._KycService.enrollmentV2(agent, parameters).subscribe(_success, _errorCatch);

    }

    public processIDScanResultWhileFaceTecSDKWaits(idScanResult: FaceTecIDScanResult, idScanResultCallback: FaceTecIDScanResultCallback) {
        this.latestIDScanResult = idScanResult;

        if (idScanResult.status !== FaceTecSDK.FaceTecIDScanStatus.Success) {
            idScanResultCallback.cancel();
            return;
        }

        var parameters: any = {
            idScan: idScanResult.idScan,
            sessionId: idScanResult.sessionId,
            externalDatabaseRefID: this.config.externalDatabaseRefId
        };

        if (idScanResult.frontImages && idScanResult.frontImages[0]) {
            parameters.idScanFrontImage = idScanResult.frontImages[0];
        }

        if (idScanResult.backImages && idScanResult.backImages[0]) {
            parameters.idScanBackImage = idScanResult.backImages[0];
        }

        this.error = null

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(this.latestSessionResult.sessionId as string);

        this._KycService.photoIDMatchV2(agent, parameters).subscribe((response) => {
            this.response = response.data

            FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('');

            return idScanResultCallback.proceedToNextStep(response.data.scanResultBlob);

        }, (err) => {
            this.error = err.error;
            idScanResultCallback.cancel()
        });
    }

    public onFaceTecSDKCompletelyDone = () => {
        if (!this.response && !this.error) {
            this.error = {
                message: "BiometricValiation_failed"
            }
        }
        this.config.callback(this.error, this.response)
    }

}

class ScanIDProcessor implements FaceTecIDScanProcessor {
    latestIDScanResult: FaceTecIDScanResult | null;

    success: boolean;

    FaceTecIDScanNextStep: FaceTecIDScanNextStep
    error: any;
    response: any;

    constructor(private config: configBiometricProcessor, private _KycService: KycService) {
        new FaceTecSDK.FaceTecSession(
            this,
            this.config.token
        );
    }

    public processIDScanResultWhileFaceTecSDKWaits(idScanResult: FaceTecIDScanResult, idScanResultCallback: FaceTecIDScanResultCallback) {
        if (idScanResult.status !== FaceTecSDK.FaceTecIDScanStatus.Success) {
            idScanResultCallback.cancel();
            return;
        }

        var parameters: any = {
            externalDatabaseRefID: this.config.externalDatabaseRefId,
            idScan: idScanResult.idScan,
        };

        if (idScanResult.frontImages && idScanResult.frontImages[0]) {
            parameters.idScanFrontImage = idScanResult.frontImages[0];
        }

        if (idScanResult.backImages && idScanResult.backImages[0]) {
            parameters.idScanBackImage = idScanResult.backImages[0];
        }

        this.error = null

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(idScanResult.sessionId as string);

        this._KycService.idScanV2(agent, parameters).subscribe((response) => {
            this.response = response.data

            FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('');

            return idScanResultCallback.proceedToNextStep(response.data.scanResultBlob);

        }, (err) => {
            this.error = err.error;
            idScanResultCallback.cancel()
        });
    }

    public onFaceTecSDKCompletelyDone = () => {
        if (!this.response && !this.error) {
            this.error = {
                message: "BiometricValiation_failed"
            }
        }
        this.config.callback(this.error, this.response)
    }

}