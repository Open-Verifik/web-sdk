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
	 */
	async listPasskeys(filters: { identifier?: string; email?: string; phone?: string; category?: string } = {}): Promise<any> {
		const params: any = {};

		if (filters.category !== undefined) {
			if (filters.category) params.category = filters.category;
		} else {
			params.category = "passKeys";
		}

		if (filters.identifier) params.identifier = filters.identifier;
		if (filters.email) params.email = filters.email;
		if (filters.phone) params.phone = filters.phone;

		return firstValueFrom(this._httpWrapper.sendRequest("get", `${this._apiUrl}/public/list`, params));
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
