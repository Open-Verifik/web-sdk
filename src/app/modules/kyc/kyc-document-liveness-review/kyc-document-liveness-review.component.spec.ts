import { ComponentFixture, TestBed } from "@angular/core/testing";

import { KycDocumentLivenessReviewComponent } from "./kyc-document-liveness-review.component";

describe("KycDocumentLivenessReviewComponent", () => {
	let component: KycDocumentLivenessReviewComponent;
	let fixture: ComponentFixture<KycDocumentLivenessReviewComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [KycDocumentLivenessReviewComponent],
		});
		fixture = TestBed.createComponent(KycDocumentLivenessReviewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
