import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SmartLivenessComponent } from "../auth/smart-enroll/smart-liveness/smart-liveness.component";
import { SmartEnrollService } from "../auth/smart-enroll/smart-enroll.service";
import { KYCService } from "../auth/kyc.service";
import { DemoService } from "../demo/demo.service";
import { Subject } from "rxjs";
import { ImageScan, AppRegistration, Project, ProjectFlow } from "../auth/project";

@Component({
    selector: "smart-liveness-test",
    standalone: true,
    imports: [CommonModule, SmartLivenessComponent],
    template: `
        <div class="fixed inset-0 bg-gray-100">
            <!-- Test Header -->
            <div class="absolute top-4 left-4 right-4 z-50">
                <div class="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    <h1 class="text-lg font-bold">🧪 DEVELOPMENT TEST MODE</h1>
                    <p class="text-sm">Testing Smart Liveness Component in Isolation</p>
                </div>
            </div>

            <!-- Test Controls -->
            <div class="absolute top-20 left-4 z-50">
                <div class="bg-white p-3 rounded-lg shadow-lg">
                    <h3 class="font-semibold mb-2">Test Controls</h3>
                    <button (click)="resetTest()" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Reset Test</button>
                    <div class="mt-2 text-xs text-gray-600">
                        <p>Attempts: {{ attempts }}</p>
                        <p>Last result: {{ lastResult || "None" }}</p>
                    </div>
                </div>
            </div>

            <!-- Smart Liveness Component -->
            <smart-liveness
                (onImageScan)="onImageScan($event)"
                [successfulUpload]="successfulUploadSubject.asObservable()"
                [retry]="retrySubject.asObservable()"
            ></smart-liveness>

            <!-- Test Results -->
            <div class="absolute bottom-4 left-4 right-4 z-50" *ngIf="lastImageScan">
                <div class="bg-green-100 border border-green-400 p-3 rounded-lg">
                    <h3 class="font-semibold text-green-800">✅ Capture Successful!</h3>
                    <p class="text-sm text-green-700">Image captured successfully. Check console for details.</p>
                    <button (click)="resetTest()" class="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                        Test Again
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100vh;
                width: 100vw;
            }
        `,
    ],
})
export class SmartLivenessTestComponent implements OnInit {
    successfulUploadSubject: Subject<void> = new Subject<void>();
    retrySubject: Subject<void> = new Subject<void>();

    attempts = 0;
    lastResult: string | null = null;
    lastImageScan: ImageScan | null = null;

    constructor(private _smartEnrollService: SmartEnrollService, private _kycService: KYCService, private _demoService: DemoService) {
        this.setupMockData();
    }

    ngOnInit(): void {}

    private setupMockData(): void {
        // Mock project data
        const mockProject: Project = {
            _id: "test-project",
            branding: {
                bgColor: "#ffffff",
                buttonColor: "#3b82f6",
                buttonTxtColor: "#ffffff",
                titleColor: "#1f2937",
            },
            name: "Test Project",
        } as Project;

        // Mock project flow with proper liveness settings
        const mockProjectFlow: ProjectFlow = {
            onboardingSettings: {
                steps: {
                    liveness: "mandatory",
                    document: "skip",
                },
                liveness: {
                    livenessMinScore: 0.7,
                    searchMode: "SEARCH_MODE_AUTO",
                    searchMinScore: 0.85,
                    maxAttempts: 3,
                },
            },
        } as ProjectFlow;

        // Mock app registration
        const mockAppRegistration: AppRegistration = {
            _id: "test-registration",
            person: {},
            face: null,
            biometricValidation: null,
            documentValidation: null,
            compareFaceVerification: null,
        } as AppRegistration;

        // Set up the services with mock data
        this._kycService.currentProject = mockProject;
        this._kycService.currentProjectFlow = mockProjectFlow;
        this._kycService.appRegistration = mockAppRegistration;

        // Initialize smart enroll service store with proper structure
        this._smartEnrollService.store.biometric.attempts = 0;
        this._smartEnrollService.store.biometric.remaining = 3;
        this._smartEnrollService.store.biometric.limit = 3;
        this._smartEnrollService.store.document.attempts = 0;
        this._smartEnrollService.store.document.remaining = 3;
        this._smartEnrollService.store.document.limit = 3;

        // Set instructions as closed to skip the dialog
        this._smartEnrollService.instructionsClosed = true;

        console.log("✅ Mock data setup complete:", {
            project: mockProject,
            projectFlow: mockProjectFlow,
            appRegistration: mockAppRegistration,
            livenessSettings: mockProjectFlow.onboardingSettings.liveness,
        });
    }

    onImageScan(imageScan: ImageScan): void {
        this.attempts++;
        this.lastImageScan = imageScan;
        this.lastResult = "Success";

        setTimeout(() => {
            this.successfulUploadSubject.next();
        }, 1000);
    }

    resetTest(): void {
        this.lastResult = null;
        this.lastImageScan = null;
        this.retrySubject.next();
    }
}
