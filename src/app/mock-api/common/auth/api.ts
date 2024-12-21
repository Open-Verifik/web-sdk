import { Injectable } from "@angular/core";
import { FuseMockApiService } from "@fuse/lib/mock-api";
import { user as userData } from "app/mock-api/common/user/data";

import { cloneDeep } from "lodash-es";

@Injectable({ providedIn: "root" })
export class AuthMockApi {
	private readonly _secret: any;
	private _user: any = userData;

	/**
	 * Constructor
	 */
	constructor(private _fuseMockApiService: FuseMockApiService) {
		// Set the mock-api
		this._secret = "YOUR_VERY_CONFIDENTIAL_SECRET_FOR_SIGNING_JWT_TOKENS!!!";

		// Register Mock API handlers
		this.registerHandlers();
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Public methods
	// -----------------------------------------------------------------------------------------------------

	/**
	 * Register Mock API handlers
	 */
	registerHandlers(): void {
		// -----------------------------------------------------------------------------------------------------
		// @ Forgot password - POST
		// -----------------------------------------------------------------------------------------------------
		this._fuseMockApiService.onPost("api/auth/forgot-password", 1000).reply(() => [200, true]);

		// -----------------------------------------------------------------------------------------------------
		// @ Reset password - POST
		// -----------------------------------------------------------------------------------------------------
		this._fuseMockApiService.onPost("api/auth/reset-password", 1000).reply(() => [200, true]);

		// -----------------------------------------------------------------------------------------------------
		// @ Sign in - POST
		// -----------------------------------------------------------------------------------------------------
		this._fuseMockApiService.onPost("api/auth/sign-in", 1500).reply(({ request }) => {
			// Sign in successful
			if (request.body.email === "hughes.brian@company.com" && request.body.password === "admin") {
				return [
					200,
					{
						user: cloneDeep(this._user),
						accessToken: this._generateJWTToken(),
						tokenType: "bearer",
					},
				];
			}

			// Invalid credentials
			return [404, false];
		});

		// -----------------------------------------------------------------------------------------------------
		// @ Sign in using the access token - POST
		// -----------------------------------------------------------------------------------------------------
		this._fuseMockApiService.onPost("api/auth/sign-in-with-token").reply(({ request }) => {
			// Get the access token
			const accessToken = request.body.accessToken;

			// Verify the token
			if (this._verifyJWTToken(accessToken)) {
				return [
					200,
					{
						user: cloneDeep(this._user),
						accessToken: this._generateJWTToken(),
						tokenType: "bearer",
					},
				];
			}

			// Invalid token
			return [
				401,
				{
					error: "Invalid token",
				},
			];
		});

		// -----------------------------------------------------------------------------------------------------
		// @ Sign up - POST
		// -----------------------------------------------------------------------------------------------------
		this._fuseMockApiService.onPost("api/auth/sign-up", 1500).reply(() =>
			// Simply return true
			[200, true]
		);

		// -----------------------------------------------------------------------------------------------------
		// @ Unlock session - POST
		// -----------------------------------------------------------------------------------------------------
		this._fuseMockApiService.onPost("api/auth/unlock-session", 1500).reply(({ request }) => {
			// Sign in successful
			if (request.body.email === "hughes.brian@company.com" && request.body.password === "admin") {
				return [
					200,
					{
						user: cloneDeep(this._user),
						accessToken: this._generateJWTToken(),
						tokenType: "bearer",
					},
				];
			}

			// Invalid credentials
			return [404, false];
		});
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Private methods
	// -----------------------------------------------------------------------------------------------------

	/**
	 * Return base64 encoded version of the given string
	 *
	 * @param source
	 * @private
	 */
	private _base64url(source: any): string {
		return "base64Token";
	}

	/**
	 * Generates a JWT token using CryptoJS library.
	 *
	 * This generator is for mocking purposes only and it is NOT
	 * safe to use it in production frontend applications!
	 *
	 * @private
	 */
	private _generateJWTToken(): string {
		return "token_here";
	}

	/**
	 * Verify the given token
	 *
	 * @param token
	 * @private
	 */
	private _verifyJWTToken(token: string): boolean {
		// Verify that the resulting signature is valid
		return true;
	}
}
