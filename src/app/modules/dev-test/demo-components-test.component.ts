import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { Subject } from "rxjs";

import { Project } from "app/core/classes/project.class";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { KYCService } from "../auth/kyc.service";
import { AppRegistration, DocumentValidation, ImageScan } from "../auth/project";
import { SmartEnrollService } from "../auth/smart-enroll/smart-enroll.service";
import { SmartLivenessDemoComponent } from "../auth/smart-enroll/smart-liveness/smart-liveness-demo.component";
import { SmartLivenessComponent } from "../auth/smart-enroll/smart-liveness/smart-liveness.component";
import { SmartScannerDemoComponent } from "../auth/smart-enroll/smart-scanner/smart-scanner-demo.component";
import { SmartScannerComponent } from "../auth/smart-enroll/smart-scanner/smart-scanner.component";
import { SmartUploadComponent } from "../auth/smart-enroll/smart-upload/smart-upload.component";
import { PasswordlessService } from "../auth/passwordless.service";

@Component({
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTabsModule,
        ReactiveFormsModule,
        SmartLivenessComponent,
        SmartLivenessDemoComponent,
        SmartScannerComponent,
        SmartScannerDemoComponent,
        SmartUploadComponent,
    ],
    selector: "demo-components-test",
    standalone: true,
    templateUrl: `./demo-components-test.component.html`,
    styles: [
        `
            :host {
                display: block;
                height: 100vh;
                width: 100vw;
            }
            .demo-tabs {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
        `,
    ],
})
export class DemoComponentsTestComponent implements OnInit {
    testForm: FormGroup;
    successfulUploadSubject: Subject<void> = new Subject<void>();

    attempts = 0;
    lastResult: string | null = null;
    lastImageScan: ImageScan | null = null;
    useDemoData = true;
    selectedTabIndex = 0;
    isInitialized = false;

    project: Project;
    projectFlow: ProjectFlow;
    appRegistration: AppRegistration;

    constructor(
        private _fb: FormBuilder,
        private _smartEnrollService: SmartEnrollService,
        private _kycService: KYCService,
        private _passwordlessService: PasswordlessService
    ) {
        this.setupMockData();

        this.testForm = this._fb.group({
            demoMode: [true, Validators.required],
            demoChoice: ["demo", Validators.required],
        });

        this._passwordlessService.currentProject = this.project;
        this._kycService.currentProjectFlow = this.projectFlow;
        this._kycService.appRegistration = this.appRegistration;
    }

    ngOnInit(): void {
        const initialValues = this.testForm.value;

        this.project.demoMode = initialValues.demoMode;
        this.useDemoData = initialValues.demoChoice === "demo";

        this.testForm.valueChanges.subscribe((values) => {
            this.project.demoMode = values.demoMode;
            this.useDemoData = values.demoChoice === "demo";

            this._passwordlessService.currentProject = this.project;
            this._kycService.currentProjectFlow = this.projectFlow;
            this._kycService.appRegistration = this.appRegistration;

            setTimeout(() => {
                this._passwordlessService.currentProject = this.project;
                this._kycService.currentProjectFlow = this.projectFlow;
                this._kycService.appRegistration = this.appRegistration;
            }, 0);
        });

        // Mark as initialized after a short delay to ensure services are ready
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    private setupMockData(): void {
        this.project = new Project({
            _id: "demo-test-project",
            name: "Demo Test Project",
            branding: {
                backgroundColor: "#ffffff",
                buttonColor: "#3b82f6",
                textColor: "#1f2937",
                titleColor: "#111827",
                image: "https://via.placeholder.com/400x200/3b82f6/ffffff?text=Demo+Project",
            },
            client: "demo-client",
            currentStep: 1,
            lastStep: 5,
            dataProtection: {
                address: "123 Demo Street",
                city: "Demo City",
                country: "US",
                email: "demo@example.com",
                name: "Demo Company",
                postalCode: "12345",
            },
            status: "active",
            target: "personal",
            demoMode: true, // Enable demo mode by default
        });

        // Create mock project flow
        this.projectFlow = new ProjectFlow({
            _id: "demo-test-flow",
            client: "demo-client",
            project: "demo-project",
            status: "active",
            target: "personal",
            type: "onboarding",
            version: 2,
            onboardingSettings: {
                steps: {
                    document: "mandatory",
                    liveness: "mandatory",
                },
            },
            allowedCountries: ["US", "CA", "MX"],
        } as any);

        // Create mock app registration
        const mockAppRegistration: AppRegistration = {
            _id: "demo-app-reg",
            client: "demo-client",
            countryCode: "US",
            cryptoValidation: {},
            currentStep: "document",
            email: "demo@example.com",
            emailValidation: {},
            MATiD: "demo-mat-id",
            phone: "+1234567890",
            phoneValidation: {},
            project: "demo-project",
            projectFlow: "demo-flow",
            signature: {},
            status: "active",
            formSubmittion: {},
            face: {
                _id: "demo-face",
                appRegistration: "demo-app-reg",
                base64: "demo-base64-data",
                category: "liveness",
                client: "demo-client",
                createdAt: new Date().toISOString(),
                person: "demo-person",
                project: "demo-project",
                projectFlow: "demo-flow",
                status: "active",
                updatedAt: new Date().toISOString(),
            },
            documentValidation: {
                _id: "demo-doc-validation",
                createdAt: new Date().toISOString(),
                deleted: false,
                documentCategory: "ID",
                documentNumber: "DEMO123456",
                documentType: "ID",
                imageValidated: true,
                inputMethod: "CAMERA",
                infoValidationSupported: true,
                MATiD: "demo-mat-id",
                namesMatch: true,
                OCRExtraction: {},
                requires2FA: false,
                requiresBackSide: true,
                backUrl: "demo-back-url",
            } as DocumentValidation,
            compareFaceVerification: {
                client: "demo-client",
                type: "compare",
                search_mode: "FAST",
                os: "web",
                liveness_min_score: 0.8,
                gallery: "demo-gallery",
                probe: "demo-probe",
                result: {
                    livenessScore: 0.8,
                    comparisonScore: 0.85,
                },
                comparedAt: new Date().toISOString(),
                status: "success",
            },
        };

        // Set up services
        this._passwordlessService.currentProject = this.project;
        this._kycService.appRegistration = mockAppRegistration;
        this._kycService.currentProjectFlow = this.projectFlow;

        // Initialize smart enroll service
        this._smartEnrollService.store.document.remaining = 3;
        this._smartEnrollService.store.biometric.remaining = 3;
    }

    onImageUpload(event: ImageScan): void {
        console.log("📤 Image Upload Event:", event);
        this.attempts++;
        this.lastResult = "Upload Success";
        this.lastImageScan = event;
        this.successfulUploadSubject.next();
    }

    onImageScan(event: ImageScan): void {
        console.log("📷 Image Scan Event:", event);
        this.attempts++;
        this.lastResult = "Scan Success";
        this.lastImageScan = event;
        this.successfulUploadSubject.next();
    }

    resetTest(): void {
        this.attempts = 0;
        this.lastResult = null;
        this.lastImageScan = null;
        this.successfulUploadSubject = new Subject<void>();
        this.setupMockData();

        // Update services with fresh mock data
        this._passwordlessService.currentProject = this.project;
        this._kycService.currentProjectFlow = this.projectFlow;
        this._kycService.appRegistration = this.appRegistration;
    }

    onTabChange(index: number): void {
        this.selectedTabIndex = index;
    }
}
