import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpWrapperService } from "./http-wrapper.service";
import { environment } from "environments/environment";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import * as faceapi from "@vladmandic/face-api";
import { DocumentValidation } from "./document-validation";

let _this = null;

@Injectable({
	providedIn: "root",
})
export class DemoService {
	private _faceapi: BehaviorSubject<any> = new BehaviorSubject(null);

	navigation: any;
	demoData: any;
	apiUrl: any;

	constructor(private _httpWrapperService: HttpWrapperService, private breakpointObserver: BreakpointObserver) {
		this.apiUrl = environment.apiUrl;

		this.loadModels();

		this.initNavigation();

		this.initDemoData();

		_this = this;

		breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).subscribe((result) => {
			this.demoData.isMobile = result.matches;
			this.demoData.time = result.matches ? 500 : 250;
		});
		this.demoData.OS = this.detectOS();
	}

	detectOS() {
		const userAgent = window.navigator.userAgent.toLowerCase();

		if (/android/.test(userAgent)) {
			return "ANDROID";
		} else if (/iphone|ipad|ipod/.test(userAgent)) {
			return "IOS";
		}

		return "DESKTOP";
	}

	get faceapi$(): Observable<boolean> {
		return this._faceapi.asObservable();
	}

	async loadModels(): Promise<void> {
		// const startTime = performance.now();
		const promises = [];
		promises.push(faceapi.nets.ssdMobilenetv1.loadFromUri("assets/models"));
		promises.push(faceapi.nets.faceLandmark68Net.loadFromUri("assets/models"));
		await Promise.allSettled(promises);

		this._faceapi.next(true);
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
		if (!this.demoData.proFields?.length && localStorage.getItem("proFields")) {
			this.demoData.pro = new DocumentValidation(JSON.parse(localStorage.getItem("pro")));

			this.demoData.proFields = this.demoData.pro.arrayFields;
		}

		if (!this.demoData.promptFields?.length && localStorage.getItem("promptFields")) {
			this.demoData.prompt = new DocumentValidation(JSON.parse(localStorage.getItem("prompt")));

			this.demoData.promptFields = this.demoData.prompt.arrayFields;
		}

		if (!this.demoData.studioFields?.length && localStorage.getItem("studioFields")) {
			this.demoData.studio = new DocumentValidation(JSON.parse(localStorage.getItem("studio")));

			this.demoData.studioFields = this.demoData.studio.arrayFields;
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

		console.log({ demoData: this.demoData });

		return this.demoData;
	}

	initDemoData(): void {
		this.demoData = {
			loading: false,
			liveness: {},
			comparison: {},
			livenessResult: [],
			comparisonResult: [],
			generalInformation: [],
			location: [],
			documentType: {},
			documentTypeFields: [],
			pro: {},
			proFields: [],
			studio: {},
			studioFields: [],
			prompt: {},
			promptFields: [],
			extractedData: [],
			lat: null,
			lng: null,
		};
	}

	setDemoDocument(response: any): void {
		this.demoData.proFields = [];

		this.demoData.promptFields = [];

		this.demoData.studioFields = [];

		this.formatAndSaveOCRs(response.pro, "pro");

		this.formatAndSaveOCRs(response.studio, "studio");

		this.formatAndSaveOCRs(response.prompt, "prompt");

		if (this.demoData.studio) {
			localStorage.setItem("documentId", this.demoData.studio._id);
		} else if (this.demoData.prompt) {
			localStorage.setItem("documentId", this.demoData.prompt._id);
		} else if (this.demoData.pro) {
			localStorage.setItem("documentId", this.demoData.pro._id);
		}
	}

	formatAndSaveOCRs(document, type: string): void {
		const typeFields = `${type}Fields`;

		if (!document || !document.documentNumber) {
			localStorage.removeItem(type);

			localStorage.removeItem(typeFields);

			return;
		}

		this.demoData[typeFields].push({ key: "documentType", value: document.documentType });

		this.demoData[typeFields].push({ key: "documentNumber", value: document.documentNumber });

		const _document = new DocumentValidation(document);

		this.demoData[type] = _document;

		this.demoData[typeFields] = _document.arrayFields;

		localStorage.setItem(type, JSON.stringify(document));

		localStorage.setItem(typeFields, JSON.stringify(this.demoData[typeFields]));
	}

	setDemoLiveness(data: any): void {
		this.demoData.liveness = data;

		this.demoData.liveness.result.liveness_score = parseInt(`${this.demoData.liveness.result.liveness_score * 100}`);

		this.demoData.liveness.result.min_score = parseInt(`${this.demoData.liveness.result.min_score * 100}`);

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

		this.demoData.comparison.result.score = parseInt(`${this.demoData.comparison.result.score * 100}`);

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

	restart(): void {
		localStorage.clear();
		this.navigation.currentStep = 1;
		localStorage.setItem("step", `${this.navigation.currentStep}`);
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

		// console.log(`Latitude: ${_this.demoData.lat}, Longitude: ${_this.demoData.lng}`);
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
		const keys = [
			"documentId",
			"pro",
			"studio",
			"prompt",
			"proFields",
			"studioFields",
			"promptFields",
			"extractedData",
			"liveness",
			"livenessId",
			"livenessResult",
			"comparison",
			"comparisonResult",
			"comparisonId",
		];

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
