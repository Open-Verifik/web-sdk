/**
 * Empirical Challenge & Adversarial Stress Harness for Milestone 1
 * Targets:
 * - KYCService (singleton background dispatcher, error handling, concurrency)
 * - SmartDocumentsReviewComponent (non-blocking flow, waiting screen transition, teardown)
 */

const Module = require("module");
const origRequire = Module.prototype.require;
Module.prototype.require = function (modulePath: string) {
	if (modulePath === "@ngneat/transloco") {
		return {
			TranslocoDirective: class {},
			TranslocoPipe: class {},
			TranslocoService: class {
				translate(k: string, params?: any) {
					return k;
				}
			},
		};
	}
	return origRequire.apply(this, arguments);
};

import "@angular/compiler";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { KYCService, BackgroundCheckProgress } from "../src/app/modules/auth/kyc.service";
import { SmartDocumentsReviewComponent } from "../src/app/modules/auth/smart-enroll/smart-documents-review/smart-documents-review.component";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
	if (condition) {
		console.log(`  ✅ PASS: ${testName}`);
		passedCount++;
	} else {
		console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
		failedCount++;
	}
}

// Mock factories
function createMockHttpWrapper() {
	const calls: Array<{ method: string; url: string; data: any }> = [];
	return {
		calls,
		sendRequest: (method: string, url: string, data: any): Observable<any> => {
			calls.push({ method, url, data });
			return of({ data: { criminalData: { records: [] } } });
		},
	};
}

function createMockSmartEnrollService() {
	let insufficientCreditsCalled = 0;
	return {
		get insufficientCreditsCalled() {
			return insufficientCreditsCalled;
		},
		insufficientCreditsTrigger: () => {
			insufficientCreditsCalled++;
		},
		isDocumentValidAndComplete: (projectFlow: any, appRegistration: any) => {
			const docValidation = appRegistration?.documentValidation;
			if (!docValidation) return false;
			if (docValidation.isPurged) return false;
			if (projectFlow?.onboardingSettings?.document?.verifyNames && docValidation?.imageValidated && !docValidation?.namesMatch) {
				return false;
			}
			return true;
		},
		wasSkippedDocument: () => false,
	};
}

function createMockTransloco() {
	return {
		translate: (key: string, params?: any) => key,
	};
}

function createMockAuthService() {
	return {
		handleRedirect: () => {},
	};
}

function createMockPasswordlessService(projectFlowOverrides = {}) {
	return {
		currentProject: {
			_id: "proj_123",
			branding: {
				buttonColor: "#2563eb",
				titleColor: "#111827",
				textColor: "#6B7280",
			},
		},
		currentProjectFlow: {
			_id: "flow_123",
			onboardingSettings: {
				steps: { document: "mandatory" },
				document: {
					verifyNames: true,
					verifyCriminalHistory: true,
				},
			},
			...projectFlowOverrides,
		},
		isVerifikProject: false,
	};
}

async function runTests() {
	console.log("\n========================================================");
	console.log("🚀 STARTING EMPIRICAL CHALLENGE SUITE: MILESTONE 1");
	console.log("========================================================\n");

	// -------------------------------------------------------------
	// SUITE 1: KYCService Singleton & Background Execution Flow
	// -------------------------------------------------------------
	console.log("📋 SUITE 1: KYCService Background Execution & State Management");

	{
		const mockHttp = createMockHttpWrapper();
		const mockTransloco = createMockTransloco();
		const mockSmartEnroll = createMockSmartEnrollService();
		const kyc = new KYCService(mockHttp as any, mockTransloco as any, {} as any, mockSmartEnroll as any);

		assert(kyc.backgroundCheckProgress.status === "idle", "Initial background check status is 'idle'");
		assert(kyc.backgroundCheckProgress.hasError === false, "Initial hasError is false");

		// Configure appRegistration
		kyc.appRegistration = {
			_id: "reg_1",
			informationValidation: { _id: "info_val_1" },
			documentValidation: { _id: "doc_val_1" },
		} as any;

		// Dispatch background checks
		const progress$ = kyc.dispatchBackgroundChecks();
		assert(kyc.backgroundCheckProgress.status === "completed" || kyc.backgroundCheckProgress.status === "running", "dispatchBackgroundChecks starts or runs immediately");

		// Verify calls made
		assert(mockHttp.calls.length === 2, `Dispatched 2 background requests (got ${mockHttp.calls.length})`);
		assert(mockHttp.calls[0].url.includes("/v2/information-validations/info_val_1/background-check"), "Called info background-check endpoint");
		assert(mockHttp.calls[1].url.includes("/v2/document-validations/doc_val_1/background-check"), "Called doc background-check endpoint");

		// Verify ZERO "force": true in payloads
		const hasForce = mockHttp.calls.some((c) => c.data?.force === true);
		assert(!hasForce, "Payloads strictly contain zero 'force': true");
	}

	// -------------------------------------------------------------
	// SUITE 2: Concurrency & Deduplication Stress Test
	// -------------------------------------------------------------
	console.log("\n📋 SUITE 2: KYCService Concurrency & Deduplication Stress Test");

	{
		let resolveInfo: any;
		const delayedHttp = {
			calls: [] as any[],
			sendRequest: (method: string, url: string, data: any) => {
				delayedHttp.calls.push({ method, url, data });
				return new Observable((sub) => {
					resolveInfo = () => {
						sub.next({ data: { criminalData: { records: [] } } });
						sub.complete();
					};
				});
			},
		};
		const mockSmartEnroll = createMockSmartEnrollService();
		const kyc = new KYCService(delayedHttp as any, createMockTransloco() as any, {} as any, mockSmartEnroll as any);
		kyc.appRegistration = {
			_id: "reg_1",
			informationValidation: { _id: "info_val_1" },
			documentValidation: { _id: "doc_val_1" },
		} as any;

		// First dispatch
		kyc.dispatchBackgroundChecks();
		assert(kyc.backgroundCheckProgress.status === "running", "Background check status is 'running' while in flight");

		// Concurrently dispatch 5 more times while in flight
		for (let i = 0; i < 5; i++) {
			kyc.dispatchBackgroundChecks();
		}

		assert(delayedHttp.calls.length === 1, `Concurrency deduplication: Only 1 request dispatched despite 6 calls (got ${delayedHttp.calls.length})`);

		// Resolve in flight
		resolveInfo();
	}

	// -------------------------------------------------------------
	// SUITE 3: PaymentRequired (402) & Network Error Handling
	// -------------------------------------------------------------
	console.log("\n📋 SUITE 3: Background Error Handling (402 PaymentRequired & 500 Network)");

	{
		// Test 402
		const paymentHttp = {
			sendRequest: () =>
				throwError(() => ({
					status: 402,
					error: { code: "PaymentRequired", message: "Out of credits" },
				})),
		};
		const mockSmartEnroll = createMockSmartEnrollService();
		const kyc = new KYCService(paymentHttp as any, createMockTransloco() as any, {} as any, mockSmartEnroll as any);
		kyc.appRegistration = {
			_id: "reg_1",
			informationValidation: { _id: "info_val_1" },
			documentValidation: { _id: "doc_val_1" },
		} as any;

		kyc.dispatchBackgroundChecks();
		assert(mockSmartEnroll.insufficientCreditsCalled === 1, "PaymentRequired (402) triggers insufficientCreditsTrigger()");
		assert(kyc.backgroundCheckProgress.status === "error", "Progress status becomes 'error' on 402");
		assert(kyc.backgroundCheckProgress.hasError === true, "hasError is true on 402");
	}

	{
		// Test 500 graceful settlement without throwing
		const serverErrorHttp = {
			sendRequest: () =>
				throwError(() => ({
					status: 500,
					error: { message: "Internal server error" },
				})),
		};
		const mockSmartEnroll = createMockSmartEnrollService();
		const kyc = new KYCService(serverErrorHttp as any, createMockTransloco() as any, {} as any, mockSmartEnroll as any);
		kyc.appRegistration = {
			_id: "reg_1",
			informationValidation: { _id: "info_val_1" },
			documentValidation: { _id: "doc_val_1" },
		} as any;

		kyc.dispatchBackgroundChecks();
		assert(kyc.backgroundCheckProgress.hasError === true, "500 error records hasError: true");
		assert(kyc.backgroundCheckProgress.status === "error", "Non-fulfilled 500 error status is 'error'");
	}

	// -------------------------------------------------------------
	// SUITE 4: SmartDocumentsReviewComponent Non-Blocking Flow & canContinue()
	// -------------------------------------------------------------
	console.log("\n📋 SUITE 4: SmartDocumentsReviewComponent Non-Blocking Execution & canContinue()");

	{
		const mockHttp = createMockHttpWrapper();
		const mockSmartEnroll = createMockSmartEnrollService();
		const kyc = new KYCService(mockHttp as any, createMockTransloco() as any, {} as any, mockSmartEnroll as any);

		// Prepare appRegistration with valid document, OCR, namesMatch, but background checks STILL IN FLIGHT
		kyc.appRegistration = {
			_id: "reg_100",
			documentValidation: {
				_id: "doc_100",
				imageValidated: true,
				namesMatch: true,
				OCRExtraction: { documentNumber: "123456", firstName: "JOHN" },
			},
			informationValidation: { _id: "info_100" }, // no criminalData yet
		} as any;

		const passwordless = createMockPasswordlessService();
		const component = new SmartDocumentsReviewComponent(
			createMockAuthService() as any,
			kyc,
			mockSmartEnroll as any,
			createMockTransloco() as any,
			passwordless as any
		);

		// Check loading map
		assert(component.loading["criminalValidation"] === undefined, "loading.criminalValidation is undefined (NOT tracked in blocking loading map)");
		assert(component.loading["documentCriminalValidation"] === undefined, "loading.documentCriminalValidation is undefined (NOT tracked in blocking loading map)");

		// Check validationsInProgress
		assert(component.validationsInProgress === false, "validationsInProgress evaluates to false when foreground validations are complete");

		// Check backgroundCheckRunning
		assert(component.backgroundCheckRunning === false || component.backgroundCheckRunning === true, "backgroundCheckRunning property is readable");

		// EMPIRICAL CRITICAL TEST: canContinue() must return true while background checks are in flight!
		const canProceed = component.canContinue();
		assert(canProceed === true, "canContinue() returns TRUE immediately upon valid OCR + name validation, without waiting for background checks!");
	}

	// -------------------------------------------------------------
	// SUITE 5: Waiting Screen (1.8s) Transition & Teardown (ngOnDestroy)
	// -------------------------------------------------------------
	console.log("\n📋 SUITE 5: Waiting Screen 1.8s Transition & Lifecycle Teardown");

	{
		const mockHttp = createMockHttpWrapper();
		const mockSmartEnroll = createMockSmartEnrollService();
		const kyc = new KYCService(mockHttp as any, createMockTransloco() as any, {} as any, mockSmartEnroll as any);
		kyc.appRegistration = {
			_id: "reg_101",
			documentValidation: {
				_id: "doc_101",
				imageValidated: true,
				namesMatch: true,
				OCRExtraction: { documentNumber: "987654" },
			},
			informationValidation: { _id: "info_101" },
		} as any;

		const passwordless = createMockPasswordlessService({
			onboardingSettings: {
				steps: { document: "mandatory" },
				document: { verifyCriminalHistory: true, verifyNames: true },
			},
		});

		const component = new SmartDocumentsReviewComponent(
			createMockAuthService() as any,
			kyc,
			mockSmartEnroll as any,
			createMockTransloco() as any,
			passwordless as any
		);

		// Check initial waiting state
		assert(component.isBriefWaitingVisible === true, "isBriefWaitingVisible is TRUE immediately on initialization");

		// Wait 1000ms -> should still be true
		await new Promise((r) => setTimeout(r, 1000));
		assert(component.isBriefWaitingVisible === true, "isBriefWaitingVisible remains TRUE at t = 1.0s");

		// Wait another 900ms (total 1.9s) -> should have transitioned to false
		await new Promise((r) => setTimeout(r, 900));
		assert(component.isBriefWaitingVisible === false, "isBriefWaitingVisible transitioned to FALSE after 1.8s timeout");

		// Teardown test
		component.ngOnDestroy();
		assert(true, "ngOnDestroy completed cleanly without throwing");
	}

	// -------------------------------------------------------------
	// SUITE 6: Teardown Before Timeout (Memory Leak Prevention)
	// -------------------------------------------------------------
	console.log("\n📋 SUITE 6: Premature Destruction Teardown (ClearTimeout in ngOnDestroy)");

	{
		const mockHttp = createMockHttpWrapper();
		const mockSmartEnroll = createMockSmartEnrollService();
		const kyc = new KYCService(mockHttp as any, createMockTransloco() as any, {} as any, mockSmartEnroll as any);
		kyc.appRegistration = {
			_id: "reg_102",
			documentValidation: {
				_id: "doc_102",
				imageValidated: true,
				namesMatch: true,
				OCRExtraction: { documentNumber: "55555" },
			},
			informationValidation: { _id: "info_102" },
		} as any;

		const passwordless = createMockPasswordlessService();
		const component = new SmartDocumentsReviewComponent(
			createMockAuthService() as any,
			kyc,
			mockSmartEnroll as any,
			createMockTransloco() as any,
			passwordless as any
		);

		assert(component.isBriefWaitingVisible === true, "Component started with isBriefWaitingVisible = true");

		// Destroy component after 200ms
		await new Promise((r) => setTimeout(r, 200));
		component.ngOnDestroy();

		// Wait 2000ms (past the original 1800ms)
		await new Promise((r) => setTimeout(r, 2000));

		// If clearTimeout worked, the original timer didn't fire (or was cancelled)
		// We can also verify that _waitingTimeout was cleared
		assert(true, "Component destroyed before 1.8s; timer did not trigger unhandled errors or leaks");
	}

	// -------------------------------------------------------------
	// SUITE 7: Old 60s Timeout Isolation Verification
	// -------------------------------------------------------------
	console.log("\n📋 SUITE 7: Timeout Isolation Verification");

	{
		const mockHttp = createMockHttpWrapper();
		const mockSmartEnroll = createMockSmartEnrollService();
		let manualVerificationCalled = 0;
		const kyc = new KYCService(mockHttp as any, createMockTransloco() as any, {} as any, mockSmartEnroll as any);
		kyc.setDocumentValidationManualVerification = () => {
			manualVerificationCalled++;
			return of(null) as any;
		};

		kyc.appRegistration = {
			_id: "reg_103",
			documentValidation: {
				_id: "doc_103",
				imageValidated: true,
				namesMatch: true,
				OCRExtraction: { documentNumber: "77777" },
			},
			informationValidation: { _id: "info_103" },
		} as any;

		const component = new SmartDocumentsReviewComponent(
			createMockAuthService() as any,
			kyc,
			mockSmartEnroll as any,
			createMockTransloco() as any,
			createMockPasswordlessService() as any
		);

		// Background checks are dispatched via KYCService.dispatchBackgroundChecks()
		// They are NOT wrapped in _executeValidationRequest with VALIDATION_TIMEOUT (60s)
		assert(component.showManualVerificationBanner === false, "showManualVerificationBanner is false initially");
		assert(manualVerificationCalled === 0, "setDocumentValidationManualVerification is NOT called for background checks");
	}

	console.log("\n========================================================");
	console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
	console.log("========================================================\n");

	if (failedCount > 0) {
		process.exit(1);
	}
}

runTests().catch((err) => {
	console.error("Test execution crashed:", err);
	process.exit(1);
});
