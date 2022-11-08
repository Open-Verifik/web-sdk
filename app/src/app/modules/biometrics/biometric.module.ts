import {
    KycService
} from './../kyc/kyc.service';

import {
    FaceTecSDK
} from 'assets/core-sdk/FaceTecSDK.js/FaceTecSDK';

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
} from 'assets/core-sdk/FaceTecSDK.js/FaceTecPublicApi';


export class Biometric {
    private _session: BehaviorSubject < boolean > = new BehaviorSubject(null);
    get session$(): Observable < boolean > {
        return this._session.asObservable();
    }

    private _auth: BehaviorSubject < boolean > = new BehaviorSubject(null);
    get auth$(): Observable < boolean > {
        return this._auth.asObservable();
    }

    private _onboardingBiometric: BehaviorSubject < boolean > = new BehaviorSubject(null);
    get onboardingBiometric$(): Observable < boolean > {
        return this._onboardingBiometric.asObservable();
    }

    private _onboardingScan: BehaviorSubject < boolean > = new BehaviorSubject(null);
    get onboardingScan$(): Observable < boolean > {
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
        this._service.getBiometrics().subscribe((response: any) => {
            const config: Array < any > = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

            FaceTecSDK.setResourceDirectory('/assets/core-sdk/FaceTecSDK.js/resources');
            FaceTecSDK.setImagesDirectory('/assets/core-sdk/FaceTec_images');

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

        this._service.getSession(agent).subscribe((response: any) => {
            // console.group('==== Biometrics ====');
            // console.info("session")
            // console.groupEnd();
            this._sessionToken = response.data.sessionToken
            this._session.next(true);
        }, err => this._session.next(false))
    }

    startAuth(projectId, phone, email) {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }

        // console.group('==== Biometrics ====');
        // console.info("startAuth")
        // console.groupEnd();

        new BiometricProcessor({
            phone,
            email,
            projectId,
            type: 'login',
            token: this._sessionToken,
            callback: (error, token) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._auth.next(token)
            }
        }, this._service)
    }

    startEnrollmentBiometrics(phone, email) {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }
        // console.group('==== Biometrics ====');
        // console.info("FaceScan")
        // console.groupEnd();

        new BiometricProcessor({
            phone,
            email,
            type: 'onboarding',
            token: this._sessionToken,
            callback: (error, token) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingBiometric.next(token);
            }
        }, this._service)
    }

    startEnrollmentDocuments(onlyScan, selectedDocument, phone, email) {
        if (!this._sessionToken) {
            throw new Error('First_start_session')
        }

        // console.group('==== Biometrics ====');
        // console.info("DocumentScan")
        // console.groupEnd();

        new PhotoIDProcessor({
            selectedDocument,
            phone,
            email,
            type: onlyScan ? 'login' : 'onboarding',
            token: this._sessionToken,
            callback: (error, token) => {
                this._sessionToken = null
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingScan.next(token)
            }
        }, this._service)

    }

    private setConfig(): void {
        const sdkImageDirectory = "/assets/core-sdk/FaceTec_images/";

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
    projectId ? : string
    email ? : string
    phone ? : string
    token: string
    type: string
    callback: any
}

class configIdScanProcessor {
    selectedDocument: string
    projectId ? : string
    token: string
    type: string
    phone: string
    email: string
    callback: any
}

class BiometricProcessor implements FaceTecFaceScanProcessor {
    error: any;
    token: any;
    success: boolean;


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
            type: this.config.type,
            phone: this.config.phone,
            email: this.config.email
        };

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(sessionResult.sessionId as string);


        const isAuthType: boolean = this.config.type === 'login'
        this.error = null
        this.token = null

        const _success = (response) => {
            FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage(isAuthType ? 'Autenticado' : 'Registro');
            this.success = response.data.success
            this.token = response.data.token

            if (this.token === 'fake-biometric-token') {
                return faceScanResultCallback.succeed()
            }

            return faceScanResultCallback.proceedToNextStep(response.data.scanResultBlob);
        }

        const _errorCatch = (err) => {
            this.error = err.error;
            faceScanResultCallback.cancel()
        }

        if (isAuthType) {
            this._KycService.authenticate(this.config.projectId, agent, parameters).subscribe(_success, _errorCatch);
        } else {
            this._KycService.enrollment(agent, parameters).subscribe(_success, _errorCatch);
        }
    }

    public onFaceTecSDKCompletelyDone = () => {
        if (!this.success && !this.error) {
            this.error = {
                message: "BiometricValiation_failed"
            }
        }
        this.config.callback(this.error, this.token)
    }
}

class PhotoIDProcessor implements FaceTecIDScanProcessor {
    latestSessionResult: FaceTecSessionResult | null;
    latestIDScanResult: FaceTecIDScanResult | null;

    success: boolean;

    FaceTecIDScanNextStep: FaceTecIDScanNextStep
    error: any;

    constructor(private config: configIdScanProcessor, private _KycService: KycService) {
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

        const parameters = {
            faceScan: sessionResult.faceScan,
            auditTrailImage: sessionResult.auditTrail[0],
            lowQualityAuditTrailImage: sessionResult.lowQualityAuditTrail[0],
            sessionId: sessionResult.sessionId,
            phone: this.config.phone,
            email: this.config.email
        };

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(sessionResult.sessionId as string);

        const isAuthType: boolean = this.config.type === 'login'
        this.error = null

        const _success = (response) => {
            FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage(isAuthType ? 'Autenticado' : 'Registro');
            return faceScanResultCallback.proceedToNextStep(response.data.scanResultBlob);
        }

        const _errorCatch = (err) => {
            this.error = err.error;
            faceScanResultCallback.cancel()
        }

        if (isAuthType) {
            // this._KycService.authenticate(this.config.projectId, agent, parameters).subscribe(_success, _errorCatch);

            faceScanResultCallback.succeed();

        } else {
            this._KycService.enrollment(agent, parameters).subscribe(_success, _errorCatch);
        }
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
            selectedDocument: this.config.selectedDocument
        };

        if (idScanResult.frontImages && idScanResult.frontImages[0]) {
            parameters.idScanFrontImage = idScanResult.frontImages[0];
        }

        if (idScanResult.backImages && idScanResult.backImages[0]) {
            parameters.idScanBackImage = idScanResult.backImages[0];
        }

        this.error = null

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(this.latestSessionResult.sessionId as string);

        this._KycService.photoIDMatch(agent, parameters).subscribe((response) => {
            this.success = response.data.success

            FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('');

            return idScanResultCallback.proceedToNextStep(response.data.scanResultBlob);

        }, (err) => {
            this.error = err.error;
            idScanResultCallback.cancel()
        });
    }

    public onFaceTecSDKCompletelyDone = () => {
        if (!this.success && !this.error) {
            this.error = {
                message: "BiometricValiation_failed"
            }
        }
        this.config.callback(this.error)
    }

}