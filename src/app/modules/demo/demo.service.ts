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
		return this.demoData;
	}

	initDemoData(): void {
		this.demoData = {
			document: {},
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
	}

	moveToStep(step: number): void {
		if (step > this.navigation.lastStep) return;

		if (step <= 0) return;

		this.navigation.currentStep = step;
	}

	getDeviceDetails(): any {
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

	async getAddress(lat, lng): Promise<any> {
		if (this.demoData.location.length) return this.demoData.location;

		const location = await this.reverseGeocodeWithOSM(this.demoData.lat, this.demoData.lng);

		if (!location) return;

		for (const key in location.address) {
			if (Object.prototype.hasOwnProperty.call(location.address, key)) {
				const value = location.address[key];

				this.demoData.location.push({ key, value });
			}
		}

		return this.demoData.location;
	}

	requestDocument(documentId: string): Observable<any> {
		return this._httpWrapperService.sendRequest("get", `${this.apiUrl}/v2/document-validations/demo/${documentId}`);
	}

	// apis to verifik
	sendDocument(data: any): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/ocr/scan-demo`, data);
	}

	cleanVariables(): void {
		localStorage.removeItem("documentId");
		localStorage.removeItem("livenessId");
	}
}
