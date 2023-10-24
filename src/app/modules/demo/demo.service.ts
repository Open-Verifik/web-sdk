import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpWrapperService } from "./http-wrapper.service";
import { environment } from "environments/environment";
let _this = null;

@Injectable({
	providedIn: "root",
})
export class DemoService {
	navigation: any;
	demoData: any;
	apiUrl: any;

	constructor(private _httpWrapperService: HttpWrapperService) {
		this.apiUrl = environment.apiUrl;

		this.initNavigation();

		this.initDemoData();

		_this = this;
	}

	getNavigation(): any {
		return this.navigation;
	}

	initNavigation(): void {
		this.navigation = {
			currentStep: 1,
			lastStep: 5,
		};
	}

	getDemoData(): any {
		if (!this.demoData.document?._id && localStorage.getItem("document")) {
			this.demoData.document = JSON.parse(localStorage.getItem("document"));
		}

		if (!this.demoData.extractedData.length && localStorage.getItem("extractedData")) {
			this.demoData.extractedData = JSON.parse(localStorage.getItem("extractedData"));
		}

		if (!this.demoData.liveness?._id && localStorage.getItem("liveness")) {
			this.demoData.liveness = JSON.parse(localStorage.getItem("liveness"));
		}

		if (!this.demoData.livenessResult.length && localStorage.getItem("livenessResult")) {
			this.demoData.livenessResult = JSON.parse(localStorage.getItem("livenessResult"));
		}

		if (!this.demoData.comparison?._id && localStorage.getItem("comparison")) {
			this.demoData.comparison = JSON.parse(localStorage.getItem("comparison"));
		}

		if (!this.demoData.comparisonResult.length && localStorage.getItem("comparisonResult")) {
			this.demoData.comparisonResult = JSON.parse(localStorage.getItem("comparisonResult"));
		}

		return this.demoData;
	}

	initDemoData(): void {
		this.demoData = {
			document: {},
			liveness: {},
			comparison: {},
			livenessResult: [],
			comparisonResult: [],
			generalInformation: [],
			location: [],
			extractedData: [],
			lat: null,
			lng: null,
		};
	}

	setDemoDocument(document: any): void {
		this.demoData.document = document;

		this.demoData.extractedData.push({ key: "documentType", value: document.documentType });

		this.demoData.extractedData.push({ key: "documentNumber", value: document.documentNumber });

		for (const key in document.OCRExtraction) {
			if (Object.prototype.hasOwnProperty.call(document.OCRExtraction, key)) {
				const value = document.OCRExtraction[key];

				if (key === "documentNumber") continue;

				this.demoData.extractedData.push({ key, value });
			}
		}

		localStorage.setItem("document", JSON.stringify(document));

		localStorage.setItem("extractedData", JSON.stringify(this.demoData.extractedData));
	}

	setDemoLiveness(data: any): void {
		this.demoData.liveness = data;

		this.demoData.livenessResult = [];

		for (const key in data.result) {
			const value = data.result[key];

			this.demoData.livenessResult.push({ key, value });
		}

		localStorage.setItem("livenessId", data._id);

		localStorage.setItem("liveness", JSON.stringify(data));

		localStorage.setItem("livenessResult", JSON.stringify(this.demoData.livenessResult));
	}

	setDemoCompare(data: any): void {
		this.demoData.comparison = data;

		for (const key in data.result) {
			const value = data.result[key];

			this.demoData.comparisonResult.push({ key, value });
		}

		localStorage.setItem("comparisonId", data._id);

		localStorage.setItem("comparison", JSON.stringify(data));

		localStorage.setItem("comparisonResult", JSON.stringify(this.demoData.comparisonResult));
	}

	moveToStep(step: number): void {
		if (step > this.navigation.lastStep) return;

		if (step <= 0) return;

		this.navigation.currentStep = step;

		localStorage.setItem("step", `${step}`);
	}

	getDeviceDetails(): any {
		if (this.demoData.generalInformation.length) return;

		const details = {
			// Navigator properties
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			appName: navigator.appName,
			appVersion: navigator.appVersion,
			language: navigator.language,
			onLine: navigator.onLine,
			cookiesEnabled: navigator.cookieEnabled,
			doNotTrack: navigator.doNotTrack,

			// Screen properties
			screenResolution: `${screen.width} x ${screen.height}`,
			screenAvailableResolution: `${screen.availWidth} x ${screen.availHeight}`,
			colorDepth: screen.colorDepth,
			pixelDepth: screen.pixelDepth,

			// Window properties
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
			outerWidth: window.outerWidth,
			outerHeight: window.outerHeight,

			// Detect touch capabilities
			touchSupported: "ontouchstart" in window,

			// Detect geolocation capabilities
			geolocationSupported: "geolocation" in navigator,

			// Browser online/offline status
			onlineStatus: navigator.onLine ? "Online" : "Offline",
		};

		this.demoData.generalInformation.push(
			{ key: "device", value: details.platform },
			{ key: "language", value: details.language },
			{ key: "userAgent", value: details.userAgent }
		);

		this.getLocation();

		return details;
	}

	getLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this.showPosition, this.showError);
		} else {
			console.log("Geolocation is not supported by this browser.");
		}
	}

	showPosition(position) {
		_this.demoData.lat = position?.coords.latitude;

		_this.demoData.lng = position?.coords.longitude;

		localStorage.setItem("lat", _this.demoData.lat);

		localStorage.setItem("lng", _this.demoData.lng);

		console.log(`Latitude: ${_this.demoData.lat}, Longitude: ${_this.demoData.lng}`);
	}

	showError(error) {
		switch (error.code) {
			case error.PERMISSION_DENIED:
				console.log("User denied the request for Geolocation.");
				break;
			case error.POSITION_UNAVAILABLE:
				console.log("Location information is unavailable.");
				break;
			case error.TIMEOUT:
				console.log("The request to get user location timed out.");
				break;
			case error.UNKNOWN_ERROR:
				console.log("An unknown error occurred.");
				break;
		}
	}

	async reverseGeocodeWithOSM(lat, lng) {
		const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

		try {
			const response = await fetch(endpoint);

			const data = await response.json();

			if (data && data.display_name) return data;

			return null;
		} catch (error) {
			console.error("Error during reverse geocoding with OSM:", error);
			return null;
		}
	}

	async getAddress(): Promise<any> {
		const lat = this.demoData.lat || localStorage.getItem("lat");
		const lng = this.demoData.lng || localStorage.getItem("lng");

		if (!lat || !lng) return null;

		if (this.demoData.location.length) return this.demoData.location;

		let _localLocation = localStorage.getItem("location");

		if (_localLocation) {
			this.demoData.location = JSON.parse(_localLocation);

			return;
		}

		const location = await this.reverseGeocodeWithOSM(lat, lng);

		if (!location) return;

		for (const key in location.address) {
			if (Object.prototype.hasOwnProperty.call(location.address, key)) {
				const value = location.address[key];

				this.demoData.location.push({ key, value });
			}
		}

		localStorage.setItem("location", JSON.stringify(this.demoData.location));

		return this.demoData.location;
	}

	requestDocument(documentId: string): Observable<any> {
		return this._httpWrapperService.sendRequest("get", `${this.apiUrl}/v2/document-validations/demo/${documentId}`);
	}

	// apis to verifik
	sendDocument(data: any): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/ocr/scan-demo`, data);
	}

	sendSelfie(data: any): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/face-recognition/liveness/demo`, data);
	}

	compareDocumentWithSelfie(data): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/face-recognition/compare/demo`, data);
	}

	cleanVariables(): void {
		const keys = ["documentId", "document", "extractedData", "liveness", "livenessId", "livenessResult", "comparison", "comparisonResult"];

		for (let index = 0; index < keys.length; index++) {
			const key = keys[index];
			localStorage.removeItem(key);

			if (!this.demoData[key]) {
				continue;
			}

			if (Array.isArray(this.demoData[key])) {
				this.demoData[key] = [];
			} else if (Object.keys(this.demoData[key])) {
				this.demoData[key] = {};
			} else {
				this.demoData[key] = null;
			}
		}
	}
}
