import { CommonModule, NgIf } from "@angular/common";
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import QRCode from "qrcode";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, Face } from "../../project";
import { EnrollSettings, EnrollStore, SmartEnrollService } from "../smart-enroll.service";

@Component({
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        NgIf,
        TranslocoModule,
        VerifikMediaDisplayComponent,
    ],
    selector: "smart-results",
    standalone: true,
    styleUrls: ["../smart-enroll.component.scss"],
    templateUrl: "./smart-results.component.html",
})
export class SmartResultsComponent implements OnInit, AfterViewInit {
    @ViewChild("qrCodeCanvas", { static: false }) public qrCodeCanvas: ElementRef<HTMLCanvasElement>;

    appRegistration: AppRegistration;
    biometricSkipped: boolean = false;
    comparisonFailed: boolean;
    comparisonScore: number;
    documentSkipped: boolean = false;
    enrollSettings: EnrollSettings;
    enrollStore: EnrollStore;
    errorContent: { message: string };
    errorResult: boolean = false;
    face: Face;
    fetchingToken: boolean;
    identityLoading: boolean = false;
    livenessFailed: boolean;
    livenessScore: number;
    isVerifikProject: boolean = false;
    loadingQRCode: boolean = false;
    project: Project;
    projectFlow: ProjectFlow;
    showQrCode: boolean = false;

    constructor(
        private _smartEnrollService: SmartEnrollService,
        private _KYCService: KYCService,
        private _authService: AuthService,
        private _passwordlessService: PasswordlessService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.enrollSettings = this._smartEnrollService.enrollSettings;
        this.enrollStore = this._smartEnrollService.store;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;
        this.isVerifikProject = this._passwordlessService.isVerifikProject;

        this.errorResult = false;
    }

    ngOnInit(): void {
        this.biometricSkipped = this._smartEnrollService.wasSkippedBiometric();
        this.documentSkipped = this._smartEnrollService.wasSkippedDocument();

        this._checkScoreStatus();
        this._requestIdentityImages();
    }

    ngAfterViewInit(): void {
        this._prepareQrCode();
    }

    private _checkScoreStatus() {
        const compareFaceVerification = this.appRegistration.compareFaceVerification;

        const compareScore = this.enrollStore.biometric.compareScore || compareFaceVerification?.result?.score || 0;
        const livenessScore = this.enrollStore.biometric.livenessScore || this.appRegistration.biometricValidation?.livenessScore || 0;

        this.comparisonScore = Math.floor((compareScore || 0) * 100);
        this.livenessScore = Math.floor((livenessScore || 0) * 100);

        this.comparisonFailed = false;
        this.errorResult = false;
        this.livenessFailed = false;

        if (!this.documentSkipped && compareFaceVerification && compareScore < this.enrollStore.biometric.compareMinScore) {
            this.appRegistration.status = "FAILED";
            this.errorResult = true;
            this.comparisonFailed = true;
        }

        if (!this.biometricSkipped && livenessScore < this.enrollStore.biometric.livenessMinScore) {
            this.appRegistration.status = "FAILED";
            this.errorResult = true;
            this.livenessFailed = true;
        }

        if (!this.errorResult) this.appRegistration.status = "COMPLETED";
    }

    private _endAndRedirect() {
        this.fetchingToken = true;

        let _response = { token: null };

        this._KYCService.syncAppRegistration("end", this.appRegistration.status).subscribe({
            next: (response) => {
                _response = response.data;
            },
            error: (exception) => {
                console.error({ exception });

                this.errorResult = true;
                this.fetchingToken = false;
            },
            complete: () => {
                this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding", this.project.demoMode);
                this.fetchingToken = false;
            },
        });
    }

    private _extractFaces(arrayOfImages: Face[]): void {
        let fallbackFace: Face;

        for (let index = 0; index < arrayOfImages.length; index++) {
            const identityImage = arrayOfImages[index];

            if (identityImage.category !== "face") {
                fallbackFace = identityImage;

                continue;
            }

            this._setFace(identityImage);
        }

        if (!this.face) this._setFace(fallbackFace);
    }

    private async _generateQRCode(canvas: HTMLCanvasElement, text: string) {
        try {
            await QRCode.toCanvas(canvas, text, { errorCorrectionLevel: "L" });

            this.loadingQRCode = false;
        } catch (e) {}
    }

    private _prepareQrCode(): void {
        const canvas = this.qrCodeCanvas.nativeElement;

        this._generateQRCode(canvas, window.location.href);
    }

    private _requestIdentityImages(): void {
        if (this.documentSkipped && this.biometricSkipped) {
            this.identityLoading = false;
            this.face = null;

            return;
        }

        this.identityLoading = true;

        this._KYCService.getIdentityImages({}).subscribe({
            next: (response) => {
                this._extractFaces(response.data);
            },
            error: () => {},
            complete: () => {},
        });
    }

    private _setFace(identityImage: Face) {
        this.face = identityImage;

        if (!this.face.base64.includes("data:image")) {
            this.face["base64"] = `data:image/jpeg;base64,${identityImage.base64}`;
        }

        const stringArr = this.face["base64"].split("data:image/jpeg;base64,");

        if (stringArr.length === 3) {
            this.face["base64"] = this.face["base64"].replace("data:image/jpeg;base64,", "");
        }

        this.identityLoading = false;
    }

    private _syncAppRegistration(step: string, status?: string, action?: string) {
        let _response: any = null;

        this._KYCService.syncAppRegistration(step, status).subscribe({
            next: (response) => {
                _response = response.data;
            },
            error: () => {},
            complete: () => {
                if (status !== "COMPLETED_WITHOUT_KYC" && action !== "redirect") return;

                this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding");
            },
        });
    }

    exitApplication(): void {
        window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
    }

    isLoginToPlatformDisabled() {
        return this.fetchingToken || this.appRegistration.status === "FAILED" || this.comparisonFailed || this.livenessFailed;
    }

    loginToPlatform(): void {
        if (this.fetchingToken) return;

        this._endAndRedirect();
    }

    logout(): void {
        localStorage.clear();

        window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
    }

    tryAgain(step: "document" | "biometric"): void {
        if (step === "document") {
            this._syncAppRegistration("document", "ONGOING");

            this._smartEnrollService.skipToStep(step);
            this._smartEnrollService.setDocumentMethod("");

            return;
        }

        this._syncAppRegistration("liveness", "ONGOING");

        this._smartEnrollService.skipToStep(step);
    }
}
