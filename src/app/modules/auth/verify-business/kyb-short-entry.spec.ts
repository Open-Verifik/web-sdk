import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap } from "@angular/router";
import { environment } from "environments/environment";

import { KybShortEntryComponent } from "./kyb-short-entry.component";

describe("KybShortEntryComponent", () => {
	let fixture: ComponentFixture<KybShortEntryComponent>;
	let component: KybShortEntryComponent;
	let httpMock: HttpTestingController;
	let routerSpy: jasmine.SpyObj<Router>;

	const computeExpectedApiBase = (): string => {
		const raw = (environment.apiUrl || "").replace(/\/+$/, "");
		if (
			typeof window !== "undefined" &&
			window.location.protocol === "https:" &&
			/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)
		) {
			return "";
		}
		return raw;
	};

	const setupComponent = (code: string | null, queryParams: Record<string, string> = {}): void => {
		routerSpy = jasmine.createSpyObj<Router>("Router", ["navigate"]);
		routerSpy.navigate.and.resolveTo(true);

		TestBed.configureTestingModule({
			imports: [KybShortEntryComponent, HttpClientTestingModule],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						snapshot: {
							paramMap: convertToParamMap(code !== null ? { code } : {}),
							queryParamMap: convertToParamMap(queryParams),
						},
					},
				},
				{ provide: Router, useValue: routerSpy },
			],
		});

		fixture = TestBed.createComponent(KybShortEntryComponent);
		component = fixture.componentInstance;
		httpMock = TestBed.inject(HttpTestingController);
	};

	afterEach(() => {
		httpMock?.verify();
		TestBed.resetTestingModule();
	});

	it("redeems valid 16-char kyb_rep_kyc code and navigates to /verify/:projectId with router state token and no token in queryParams", async () => {
		const code = "AbCdEfGh12345678";
		setupComponent(code, { locale: "es", style: "b" });

		const initPromise = component.ngOnInit();

		const req = httpMock.expectOne(`${computeExpectedApiBase()}/v2/business-registrations/short-link/redeem`);
		expect(req.request.method).toBe("POST");
		expect(req.request.body).toEqual({ code });

		req.flush({
			success: true,
			data: {
				kind: "kyb_rep_kyc",
				targetRoute: "/verify/proj123",
				queryParams: { rep: "1", handoff: "1" },
				token: "jwt-rep-secret-token",
			},
		});

		await initPromise;

		expect(component.errorMessage).toBeNull();
		expect(routerSpy.navigate).toHaveBeenCalledOnceWith(["/verify/proj123"], {
			queryParams: { rep: "1", handoff: "1", locale: "es", style: "b" },
			state: {
				kybRedeemedToken: "jwt-rep-secret-token",
				kybExplicitSession: true,
			},
			replaceUrl: true,
		});
		const navExtras = routerSpy.navigate.calls.mostRecent().args[1];
		expect(navExtras?.queryParams?.["token"]).toBeUndefined();
	});

	it("redeems valid 16-char kyb_session code and navigates to /verify-business/:projectId with router state token and no token in queryParams", async () => {
		const code = "Z9y8X7w6V5u4T3s2";
		setupComponent(code);

		const initPromise = component.ngOnInit();

		const req = httpMock.expectOne(`${computeExpectedApiBase()}/v2/business-registrations/short-link/redeem`);
		expect(req.request.method).toBe("POST");
		expect(req.request.body).toEqual({ code });

		req.flush({
			success: true,
			data: {
				kind: "kyb_session",
				targetRoute: "/verify-business/proj456",
				queryParams: {},
				token: "jwt-session-secret-token",
			},
		});

		await initPromise;

		expect(component.errorMessage).toBeNull();
		expect(routerSpy.navigate).toHaveBeenCalledOnceWith(["/verify-business/proj456"], {
			queryParams: {},
			state: {
				kybRedeemedToken: "jwt-session-secret-token",
				kybExplicitSession: true,
			},
			replaceUrl: true,
		});
		const navExtras = routerSpy.navigate.calls.mostRecent().args[1];
		expect(navExtras?.queryParams?.["token"]).toBeUndefined();
	});

	it("fails closed on invalid-format code with errorMessage and zero HTTP calls", async () => {
		setupComponent("bad-code!");

		await component.ngOnInit();

		httpMock.expectNone(`${computeExpectedApiBase()}/v2/business-registrations/short-link/redeem`);
		expect(component.errorMessage).toBeTruthy();
		expect(routerSpy.navigate).not.toHaveBeenCalled();
	});

	it("sets errorMessage and does not navigate on API 401/404 failure", async () => {
		const code = "12345678AbCdEfGh";
		setupComponent(code);

		const initPromise = component.ngOnInit();

		const req = httpMock.expectOne(`${computeExpectedApiBase()}/v2/business-registrations/short-link/redeem`);
		req.flush(
			{ success: false, message: "Short link expired or not found." },
			{ status: 404, statusText: "Not Found" }
		);

		await initPromise;

		expect(component.errorMessage).toBe("Short link expired or not found.");
		expect(routerSpy.navigate).not.toHaveBeenCalled();

		// Also verify 401 fallback message when backend omits message
		TestBed.resetTestingModule();
		setupComponent(code);
		const secondInit = component.ngOnInit();
		const req401 = httpMock.expectOne(`${computeExpectedApiBase()}/v2/business-registrations/short-link/redeem`);
		req401.flush({}, { status: 401, statusText: "Unauthorized" });
		await secondInit;

		expect(component.errorMessage).toBe("This verification link is invalid or has expired.");
		expect(routerSpy.navigate).not.toHaveBeenCalled();
	});
});
