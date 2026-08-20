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

		if (filters.identifier) params.identifier = filters.identifier;
		if (filters.email) params.email = filters.email;
		if (filters.phone) params.phone = filters.phone;

		// Contact lookups should not force category=passKeys; identifier/email/phone drive Pinata filters.
		if (filters.category !== undefined) {
			if (filters.category) params.category = filters.category;
		} else if (!filters.identifier && !filters.email && !filters.phone) {
			params.category = "passKeys";
		}

		const response = await firstValueFrom(this._httpWrapper.sendRequest("get", `${this._apiUrl}/public/list`, params));

		// If requested, fetch encrypted content from IPFS for each passkey
		if (fetchEncryptedContent && response?.data && Array.isArray(response.data)) {
			const passkeyRecords = response.data.filter((passkey) => this._isPasskeyRecord(passkey));
			console.log("[PasskeyZelfService] Fetching encrypted content from IPFS for", passkeyRecords.length, "passkeys");

			for (const passkey of passkeyRecords) {
				if (!passkey.url) {
					continue;
				}

				try {
					passkey.encryptedContent = await this._fetchEncryptedContent(passkey.url);
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

		return response;
	}

	/**
	 * Email/phone Pinata lists can include appRegistration (and other) pins whose
	 * `url` points at a PNG. Only passKeys JSON blobs are decryptable.
	 */
	private _isPasskeyRecord(record: { publicData?: Record<string, unknown> }): boolean {
		const type = `${record.publicData?.type || ""}`;
		const category = `${record.publicData?.category || ""}`;
		return type === "passKeys" || category.endsWith("_passKeys");
	}

	private async _fetchEncryptedContent(url: string): Promise<{ iv?: string; ciphertext?: string }> {
		const res = await fetch(url);
		const contentType = `${res.headers.get("content-type") || ""}`.toLowerCase();

		if (contentType.includes("image/")) {
			throw new Error(`IPFS URL is not JSON (content-type: ${contentType})`);
		}

		const raw = await res.text();
		const trimmed = raw.trim();

		// PNG magic byte 0x89 — gateway sometimes omits/misreports content-type.
		if (!trimmed || trimmed.charCodeAt(0) === 0x89 || trimmed.startsWith("PNG")) {
			throw new Error("IPFS URL returned an image, not passkey JSON");
		}

		const encryptedFile = JSON.parse(trimmed);
		const payloadString = encryptedFile.encryptedToken || encryptedFile;

		return typeof payloadString === "string" ? JSON.parse(payloadString) : payloadString;
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
