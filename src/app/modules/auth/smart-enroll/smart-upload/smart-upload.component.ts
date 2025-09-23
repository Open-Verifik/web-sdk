import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import * as faceapi from "@vladmandic/face-api";
import { Observable, Subject, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { DragAndDropModule } from "app/modules/auth/drag-and-drop/drag-and-drop.module";
import { KYCService } from "app/modules/auth/kyc.service";
import { DemoService } from "app/modules/demo/demo.service";
import { AppRegistration, ImageScan } from "../../project";
import { SmartEnrollService } from "../smart-enroll.service";
import { PasswordlessService } from "../../passwordless.service";
import { PromptTemplate } from "app/core/models/prompt-template.model";

const MAX_FILE_SIZE = 10485760;

@Component({
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    selector: "smart-upload",
    standalone: true,
    styleUrls: ["../smart-enroll.component.scss"],
    templateUrl: "./smart-upload.component.html",
    imports: [
        CommonModule,
        DragAndDropModule,
        FlexLayoutModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        NgIf,
        TranslocoModule,
    ],
})
export class SmartUploadComponent implements OnInit, OnDestroy {
    @ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;

    @Output("onImageUpload") onImageUpload: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();
    @Output("goBackToMethodSelection") goBackToMethodSelection: EventEmitter<void> = new EventEmitter<void>();

    @Input() successfulUpload: Observable<{ livenessScore?: number }>;

    private unsubscriber$: Subject<void> = new Subject<void>();

    appRegistration: AppRegistration;
    base64Image: any;
    demoData: any;
    errorContent: any;
    errorResult: boolean;
    faceIdCard: string;
    file: File;
    fileProgress: number = 0;
    isExtracting: boolean = false;
    project: Project;
    projectFlow: ProjectFlow;
    promptTemplate: PromptTemplate;
    side: "back" | "front" = "front";

    constructor(
        private _demoService: DemoService,
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService,
        private _passwordlessService: PasswordlessService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.demoData = this._demoService.getDemoData();

        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;

        this.promptTemplate = this._smartEnrollService.enrollSettings.promptTemplate;
    }

    ngOnInit(): void {
        this.successfulUpload.pipe(takeUntil(this.unsubscriber$)).subscribe(() => {
            this.fileProgress = 100;
            this.errorResult = false;
            this.errorContent = { message: "" };
            this.isExtracting = false;

            this.appRegistration = this._KYCService.appRegistration;
        });
    }

    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }

    get requiresBack(): boolean {
        return this.promptTemplate.requiresBackSide || this.appRegistration?.documentValidation?.requiresBackSide;
    }

    private async _detectFace(image: HTMLImageElement) {
        const faceEngine = this._demoService.faceEngine;
        const faces = await faceapi.detectAllFaces(image, faceEngine).withFaceLandmarks(!this._demoService.useSsdMobilenetv1);

        if (!faces.length) return;

        return faces.map((face) => face.detection.box);
    }

    private async _fileOnLoad(event: ProgressEvent<FileReader>, img: HTMLImageElement) {
        try {
            this.fileProgress += 10;
            this.base64Image = event.target.result;

            const base64Image = this.base64Image.replace(/^data:image\/.*;base64,/, "");

            let face: string;

            if (this.side === "front") {
                await this._setFaceToCanvas(img);
                face = this.faceIdCard.replace(/^data:image\/.*;base64,/, "");
            }

            const isFront = this.side === "front";
            this.isExtracting = true;

            this.onImageUpload.next({
                base64Image,
                face,
                force: !isFront || !!this.appRegistration.documentValidation,
                front: isFront,
                inputMethod: "FILE_UPLOAD",
                rawImage: this.base64Image,
                source: "document",
            });
        } catch (error) {
            const message = new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/).test(error?.message) ? error?.message : "failed_to_handle_file";

            this.errorResult = true;
            this.errorContent = { message };
            this.fileProgress = 100;
            this.isExtracting = false;
        }
    }

    private _prepareFilesList(files: Array<File>) {
        if (this.file) return;

        this.file = files[0];
        this.fileInput.nativeElement.value = "";

        if (this.file.size > MAX_FILE_SIZE) {
            this.fileProgress = 0;
            this.errorResult = true;
            this.errorContent = { message: "file_too_big" };

            return;
        }

        const fileReader = new FileReader();
        this.fileProgress = 25;

        fileReader.onload = (event: any) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = async () => await this._fileOnLoad(event, img);
        };

        fileReader.readAsDataURL(this.file);
    }

    private async _setFaceToCanvas(img: HTMLImageElement) {
        const faces = await this._detectFace(img);

        if (!faces) throw Error("face_not_found");

        const documentFace = this._demoService.getBiggestFace(faces);

        this.faceIdCard = this._demoService.cutFaceIdCard(img, documentFace, this.faceCardCanvas.nativeElement);
    }

    canSkipStep(): boolean {
        if (this.isExtracting) return false;

        const canSkipDocument = this.projectFlow.onboardingSettings.steps.document !== "mandatory" && !this.appRegistration.documentValidation;

        return canSkipDocument;
    }

    fileBrowseHandler(files: Array<File>) {
        this._prepareFilesList(files);
    }

    formatBytes(bytes: number, decimals = 2) {
        if (bytes === 0) {
            return "0 Bytes";
        }

        const k = 1024;
        const dm = decimals <= 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    goNext(): void {
        if (this.requiresBack && this.side !== "back") {
            this.side = "back";
            this.resetFileUpload();

            return;
        } else if (this.appRegistration.documentValidation || !this._smartEnrollService.wasSkippedDocument()) {
            this._smartEnrollService.goToNextStep(); // document-review

            return;
        }

        this.skipStep();
    }

    goBack(): void {
        this.goBackToMethodSelection.emit();
    }

    goPrevious(): void {
        if (this.requiresBack && this.side !== "front") {
            this.side = "front";
            this.resetFileUpload();
        } else {
            this._smartEnrollService.setDocumentMethod("");
            this._smartEnrollService.goToPreviousStep();
        }
    }

    isContinueActive(): boolean {
        return this.base64Image && this.fileProgress === 100;
    }

    onFileDropped($event: Array<File>) {
        this._prepareFilesList($event);
    }

    resetFileUpload(): void {
        this.base64Image = "";
        this.errorContent = { message: "" };
        this.errorResult = false;
        this.file = null;
        this.fileProgress = 0;
        this.isExtracting = false;
    }

    showGovernmentIDColor(): boolean {
        return (
            !this.appRegistration.documentValidation ||
            (this.fileProgress < 100 && this.side === "front") ||
            ((this.fileProgress === 100 || this.side === "back") &&
                ["id", "idv2"].includes(this.appRegistration.documentValidation?.documentCategory?.toLowerCase()))
        );
    }

    showLicenseColor(): boolean {
        return (
            !this.appRegistration.documentValidation ||
            (this.fileProgress < 100 && this.side === "front") ||
            ((this.fileProgress === 100 || this.side === "back") &&
                this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === "driverlicense")
        );
    }

    showPassportColor(): boolean {
        return (
            !this.appRegistration.documentValidation ||
            (this.fileProgress < 100 && this.side === "front") ||
            ((this.fileProgress === 100 || this.side === "back") &&
                this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === "passport")
        );
    }

    showTaxInformationColor(): boolean {
        return (
            !this.appRegistration.documentValidation ||
            (this.fileProgress < 100 && this.side === "front") ||
            ((this.fileProgress === 100 || this.side === "back") &&
                this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === "taxdocument")
        );
    }

    skipStep(): void {
        if (this.projectFlow.onboardingSettings.steps.liveness !== "skip" && !this._smartEnrollService.wasSkippedBiometric()) {
            this._smartEnrollService.setSkippedDocument(!this.appRegistration.documentValidation);
            this._smartEnrollService.skipToStep("biometric");
        } else {
            this._smartEnrollService.setSkippedBiometric(!this.appRegistration.biometricValidation);
            this._smartEnrollService.skipToStep("result");
        }
    }
}
