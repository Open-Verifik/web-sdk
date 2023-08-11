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
export class DemoBiometric {
    private _isReady: BehaviorSubject < boolean > = new BehaviorSubject(null);
    currentLanguage: string;
    get isReady$(): Observable < boolean > {
        return this._isReady.asObservable();
    }

    private _auth: BehaviorSubject < any > = new BehaviorSubject(null);
    get auth$(): Observable < any > {
        return this._auth.asObservable();
    }

    private _onboardingScan: BehaviorSubject < any > = new BehaviorSubject(null);
    get onboardingScan$(): Observable < any > {
        return this._onboardingScan.asObservable();
    }

    private _error: BehaviorSubject < string > = new BehaviorSubject(null);
    get error$(): Observable < string > {
        return this._error.asObservable();
    }

    constructor(
        private _service: BiometricService,
    ) {
        const status = FaceTecSDK.getStatus()

        if (!status) {
            this._loadConfig();
        }
        return this
    }

    _loadConfig(): void {
        cacheKeys.forEach(key => {
            localStorage.removeItem(key)
        })
        indexedDB.deleteDatabase(databaseName);
        
        FaceTecSDK.setResourceDirectory('/assets/core/sdk/resources');

        this._service.getProjectConfig().subscribe((response: any) => {
            const config: Array < any > = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

            setConfig(FaceTecSDK)

            FaceTecSDK.initializeInProductionMode(config[0], config[1], config[2], (isBiometricLibReady) => {
                // console.group('==== Biometrics ====');
                // console.info("Lib", isBiometricLibReady)
                // console.groupEnd();

                if (isBiometricLibReady) {
                    const lang = localStorage.getItem('lang') || 'en'
                    FaceTecSDK.configureLocalization(languages[lang]);

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

    getStatus():boolean {
        return FaceTecSDK.getStatus()
    }

    private async _startSession():Promise<string> {
        this.startLanguage()
        const agent = FaceTecSDK.createFaceTecAPIUserAgentString('');

        return await new Promise((resolve, reject) => {
            this._service.getProjectSession(agent)
                .subscribe((response: any) => resolve(response.data.sessionToken), reject)
        });
    }

    async startLiveness() {
        const _sessionToken = await this._startSession()
        
        // console.log(_sessionToken);
        // console.group('==== Biometrics ====');
        // console.info("startAuth")
        // console.groupEnd();

        new BiometricProcessor({
            type: 'login',
            token: _sessionToken,
            callback: (error, response) => {
                // console.log({...error, ...response})
                if (error) {
                    return this._error.next(error.message)
                }

                this._auth.next(response)
            }
        }, this._service)
    }

    async startIdScan() {
        const _sessionToken = await this._startSession()

        // console.log({token:_sessionToken, message:'ocr'});
        // console.group('==== Biometrics ====');
        // console.info("DocumentScan")
        // console.groupEnd();
        
        new ScanIDProcessor({
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
        // console.log(config)
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

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(sessionResult.sessionId as string);

        const parameters: any = {
            faceScan: sessionResult.faceScan,
            auditTrailImage: sessionResult.auditTrail[0],
            lowQualityAuditTrailImage: sessionResult.lowQualityAuditTrail[0],
            sessionId: sessionResult.sessionId,
            externalDatabaseRefID: this.config.externalDatabaseRefId,
            agent: agent
        };

        if (this.config.group) {
            parameters.group = this.config.group
        }


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
                this._service.demoLiveness(agent, parameters).subscribe(_success, _errorCatch);

                break;

            default:
                break;
        }
    }

    public onFaceTecSDKCompletelyDone = () => {
        // console.log({})
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
        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(idScanResult.sessionId as string);

        var parameters: any = {
            externalDatabaseRefID: this.config.externalDatabaseRefId,
            idScan: idScanResult.idScan,
            agent: agent
        };

        if (idScanResult.frontImages && idScanResult.frontImages[0]) {
            parameters.idScanFrontImage = idScanResult.frontImages[0];
        }

        if (idScanResult.backImages && idScanResult.backImages[0]) {
            parameters.idScanBackImage = idScanResult.backImages[0];
        }

        this.error = null


        this._service.demoScan(agent, parameters).subscribe((response) => {
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

        this._service.demoScan(agent, parameters).subscribe(_success, _errorCatch);

    }

    public processIDScanResultWhileFaceTecSDKWaits(idScanResult: FaceTecIDScanResult, idScanResultCallback: FaceTecIDScanResultCallback) {
        this.latestIDScanResult = idScanResult;

        if (idScanResult.status !== FaceTecSDK.FaceTecIDScanStatus.Success) {
            idScanResultCallback.cancel();
            return;
        }

        const agent = FaceTecSDK.createFaceTecAPIUserAgentString(this.latestSessionResult.sessionId as string);

        var parameters: any = {
            idScan: idScanResult.idScan,
            sessionId: idScanResult.sessionId,
            externalDatabaseRefID: this.config.externalDatabaseRefId,
            agent:  agent
        };

        if (idScanResult.frontImages && idScanResult.frontImages[0]) {
            parameters.idScanFrontImage = idScanResult.frontImages[0];
        }

        if (idScanResult.backImages && idScanResult.backImages[0]) {
            parameters.idScanBackImage = idScanResult.backImages[0];
        }

        this.error = null


        this._service.idscanDemo(agent, parameters).subscribe((response) => {
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
