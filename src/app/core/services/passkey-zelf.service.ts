import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { firstValueFrom } from "rxjs";
import { HttpWrapperService } from "app/modules/demo/http-wrapper.service";

@Injectable({
	providedIn: "root",
})
export class PasskeyZelfService {
	private _apiUrl = `${environment.apiUrl}/v2/zelf-key`;

	constructor(private _httpWrapper: HttpWrapperService) {}

	/**
	 * Upload (Create) a Passkey entry in ZelfKey storage
	 * Maps to POST /v2/zelf-key/store/passkeys
	 */
	async createPasskey(payload: {
		faceBase64?: string;
		zelfProof?: string;
		publicData: any;
		identifier?: string;
		payload?: string; // Encrypted Token
	}): Promise<any> {
		return firstValueFrom(this._httpWrapper.sendRequest("post", `${this._apiUrl}/store/passkeys`, payload));
	}

	/**
	 * List Passkeys (Check Existence)
	 * Maps to GET /v2/zelf-key/list?category=passKeys
	 * @param filters - Filter criteria for passkeys
	 * @param fetchEncryptedContent - If true, fetches the encrypted content from IPFS URLs
	 */
	async listPasskeys(
		filters: { identifier?: string; email?: string; phone?: string; category?: string } = {},
		fetchEncryptedContent: boolean = false
	): Promise<any> {
		const params: any = {};

		if (filters.category !== undefined) {
			if (filters.category) params.category = filters.category;
		} else {
			params.category = "passKeys";
		}

		if (filters.identifier) params.identifier = filters.identifier;
		if (filters.email) params.email = filters.email;
		if (filters.phone) params.phone = filters.phone;

		const response = await firstValueFrom(this._httpWrapper.sendRequest("get", `${this._apiUrl}/public/list`, params));

		// If requested, fetch encrypted content from IPFS for each passkey
		if (fetchEncryptedContent && response?.data && Array.isArray(response.data)) {
			console.log("[PasskeyZelfService] Fetching encrypted content from IPFS for", response.data.length, "passkeys");

			for (const passkey of response.data) {
				if (passkey.url) {
					try {
						const encryptedFile = await fetch(passkey.url).then((res) => res.json());
						const payloadString = encryptedFile.encryptedToken || encryptedFile;
						const encryptedContent = typeof payloadString === "string" ? JSON.parse(payloadString) : payloadString;

						// Add the encrypted content to the passkey object
						passkey.encryptedContent = encryptedContent;
						console.log("[PasskeyZelfService] Fetched encrypted content for passkey:", passkey.publicData?.identifier);
					} catch (error) {
						console.error(
							"[PasskeyZelfService] Failed to fetch encrypted content from IPFS for passkey:",
							passkey.publicData?.identifier,
							error
						);
					}
				}
			}
		}

		return response;
	}

	/**
	 * Retrieve (Decrypt) a Passkey
	 * Maps to POST /v2/zelf-key/retrieve
	 */
	async getPasskey(payload: {
		faceBase64: string;
		zelfProof: string;
		password: string; // The "password" here is the MasterKey/PRF Key
	}): Promise<any> {
		return firstValueFrom(this._httpWrapper.sendRequest("post", `${this._apiUrl}/retrieve`, payload));
	}
}
