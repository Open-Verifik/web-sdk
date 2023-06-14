import {
    languages,
    setConfig
} from './biometric.config';

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
} from 'assets/core/sdk/FaceTecPublicApi';
import {
    BiometricService
} from './biometric.service';
import {
    Injectable
} from '@angular/core';

const cacheKeys = ['ft.fsh', 'ft.ic', 'zoom.installationID', 'zoom.lk']
const databaseName = "FTIDB"

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

@Injectable({
    providedIn: 'root'
})
export class Biometric {
    private _isReady: BehaviorSubject < boolean > = new BehaviorSubject(null);
    get isReady$(): Observable < boolean > {
        return this._isReady.asObservable();
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

    private currentLanguage
    constructor(
        private _service: BiometricService,
    ) {
        const status = FaceTecSDK.getStatus()

        if (!status) {
            this._loadConfig();
        }
        
        return this
    }

    getStatus():boolean {
        const status = FaceTecSDK.getStatus()
        console.group('==== Biometrics ====');
        console.info("status", status)
        console.groupEnd();
        return status
    }

    _loadConfig(): void {
        cacheKeys.forEach(key => {
            localStorage.removeItem(key)
        })
        indexedDB.deleteDatabase(databaseName);

        FaceTecSDK.setResourceDirectory('/assets/core/sdk/resources');

        this._service.getConfig().subscribe((response: any) => {
            const config: Array < any > = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

            setConfig(FaceTecSDK)

            FaceTecSDK.initializeInProductionMode(config[0], config[1], config[2], (isBiometricLibReady) => {
                console.group('==== Biometrics ====');
                console.info("LibraryReady", isBiometricLibReady)
                console.groupEnd();

                if (isBiometricLibReady) {
                    this.currentLanguage = localStorage.getItem('lang') || 'es'
                    FaceTecSDK.configureLocalization(languages[this.currentLanguage]);
                }

                this._isReady.next(isBiometricLibReady);
            });
        });
    }

    startLanguage() {
        const lang = localStorage.getItem('lang') || 'es'
        if(this.currentLanguage !== lang){
            this.currentLanguage = lang
            FaceTecSDK.configureLocalization(languages[lang]);
        }
    }

    private async _startSession():Promise<string> {
        this.startLanguage()
        const agent = FaceTecSDK.createFaceTecAPIUserAgentString('');

        return await new Promise((resolve, reject) => {
            this._service.getSession(agent)
                .subscribe((response: any) => resolve(response.data), reject)
        });
    }

    async startAuth(externalDatabaseRefId) {
        const _sessionToken = await this._startSession()

        // console.group('==== Biometrics ====');
        // console.info("startAuth")
        // console.groupEnd();

        new BiometricProcessor({
            externalDatabaseRefId,
            type: 'login',
            token: _sessionToken,
            callback: (error, response) => {
                if (error) {
                    return this._error.next(error.message)
                }

                this._auth.next(response)
            }
        }, this._service)
    }

    async startLiveness() {
        const _sessionToken = await this._startSession()

        // console.group('==== Biometrics ====');
        // console.info("startAuth")
        // console.groupEnd();

        new BiometricProcessor({
            type: 'liveness',
            token: _sessionToken,
            callback: (error, response) => {
                if (error) {
                    return this._error.next(error.message)
                }

                this._liveness.next(response)
            }
        }, this._service)
    }

    async startEnrollmentBiometrics(externalDatabaseRefId, group) {
        const _sessionToken = await this._startSession()

        // console.group('==== Biometrics ====');
        // console.info("FaceScan")
        // console.groupEnd();

        new BiometricProcessor({
            externalDatabaseRefId,
            group,
            type: 'onboarding',
            token: _sessionToken,
            callback: (error, response) => {
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingBiometric.next(response);
            }
        }, this._service)
    }

    async startEnrollmentDocument(externalDatabaseRefId) {
        const _sessionToken = await this._startSession()

        // console.group('==== Biometrics ====');
        // console.info("DocumentScan")
        // console.groupEnd();

        new PhotoIDProcessor({
            externalDatabaseRefId,
            token: _sessionToken,
            callback: (error, response) => {
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingScan.next(response)
            }
        }, this._service)

    }

    async startIdScan(externalDatabaseRefId) {
        const _sessionToken = await this._startSession()


        // console.group('==== Biometrics ====');
        // console.info("DocumentScan")
        // console.groupEnd();

        new ScanIDProcessor({
            externalDatabaseRefId,
            token: _sessionToken,
            callback: (error, response) => {
                if (error) {
                    return this._error.next(error.message)
                }

                this._onboardingScan.next(response)
            }
        }, this._service)

    }

}

class BiometricProcessor implements FaceTecFaceScanProcessor {
    error: any;
    token: any;
    success: boolean;
    response: any;

    constructor(private config: configBiometricProcessor, private _service: BiometricService) {
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
                this._service.authenticate(agent, parameters).subscribe(_success, _errorCatch);

                break;
            case 'onboarding':
                FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('Registro');
                this._service.enrollment(agent, parameters).subscribe(_success, _errorCatch);

                break;
            case 'liveness':
                FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage('Valido');
                this._service.liveness(agent, parameters).subscribe(_success, _errorCatch);
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

    constructor(private config: configBiometricProcessor, private _service: BiometricService) {
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

        this._service.enrollment(agent, parameters).subscribe(_success, _errorCatch);

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

        this._service.photoIDMatch(agent, parameters).subscribe((response) => {
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

    constructor(private config: configBiometricProcessor, private _service: BiometricService) {
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

        this._service.idScan(agent, parameters).subscribe((response) => {
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