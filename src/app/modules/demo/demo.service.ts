import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpWrapperService } from "./http-wrapper.service";
import { environment } from "environments/environment";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import * as faceapi from "@vladmandic/face-api";
import { DocumentValidation } from "./document-validation";
import { Lead, Session } from "./lead";

let _this = null;

@Injectable({
	providedIn: "root",
})
export class DemoService {
	private _faceapi: BehaviorSubject<any> = new BehaviorSubject(null);

	private _geoLocation: BehaviorSubject<any> = new BehaviorSubject(null);

	navigation: any;
	demoData: any;
	lead: any;
	apiUrl: any;
	session: any;
	sampleLastNames: Array<any>;
	sampleFirstNames: Array<any>;

	constructor(private _httpWrapperService: HttpWrapperService, private breakpointObserver: BreakpointObserver) {
		this.apiUrl = environment.apiUrl;

		this.loadModels();

		this.initNavigation();

		this.initDemoData();

		this.initSampleData();

		_this = this;

		breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).subscribe((result) => {
			this.demoData.isMobile = result.matches;

			this.demoData.time = result.matches ? 500 : 250;
		});

		this.demoData.OS = this.detectOS();
	}

	initSampleData(): void {
		if (environment.production) return;

		this.sampleLastNames = [
			"Smith",
			"Johnson",
			"Williams",
			"Jones",
			"Brown",
			"Davis",
			"Miller",
			"Wilson",
			"Moore",
			"Taylor",
			"Reynolds",
			"Specter",
			"Litt",
			"Ross",
			"García",
			"Fernández",
			"González",
			"Rodríguez",
			"López",
			"Martínez",
			"Sánchez",
			"Pérez",
			"Martín",
			"Gómez",
		];

		this.sampleFirstNames = [
			"James",
			"John",
			"Robert",
			"Michael",
			"William",
			"David",
			"Richard",
			"Joseph",
			"Thomas",
			"Charles",
			"Mike",
			"Harvey",
			"José",
			"Juan",
			"Miguel",
			"Luis",
			"Antonio",
			"Javier",
			"Francisco",
			"Carlos",
			"Alejandro",
			"Manuel",
			"Rogelio",
			"Alexander",
		];
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

	get geoLocation$(): Observable<any> {
		return this._geoLocation.asObservable();
	}

	async loadModels(): Promise<void> {
		// const startTime = performance.now();
		const promises = [];
		promises.push(faceapi.nets.ssdMobilenetv1.loadFromUri("assets/models"));
		promises.push(faceapi.nets.faceLandmark68Net.loadFromUri("assets/models"));
		await Promise.allSettled(promises);

		this._faceapi.next(true);
		return;
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
		this.cleanVariables();

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
		localStorage.removeItem("locationError");

		const lat = localStorage.getItem("lat");

		const lng = localStorage.getItem("lng");

		if (lat && lng) {
			_this._geoLocation.next({
				lat,
				lng,
			});
		}

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this.showPosition, this.showError);
		} else {
			console.info("Geolocation is not supported by this browser.");
		}
	}

	showPosition(position) {
		if (!_this._geoLocation || !position?.coords) return;

		_this.demoData.lat = position?.coords.latitude;

		_this.demoData.lng = position?.coords.longitude;

		localStorage.setItem("lat", _this.demoData.lat);

		localStorage.setItem("lng", _this.demoData.lng);

		_this._geoLocation.next({
			lat: position?.coords.latitude,
			lng: position?.coords.longitude,
		});
	}

	showError(error) {
		let errorMessage = "";

		switch (error.code) {
			case error.PERMISSION_DENIED:
				errorMessage = "geolocation.user_denied_request";

				break;
			case error.POSITION_UNAVAILABLE:
				errorMessage = "geolocation.information_unavailable";
				break;
			case error.TIMEOUT:
				errorMessage = "geolocation.request_timeout";
				break;
			case error.UNKNOWN_ERROR:
				errorMessage = "geolocation.unknown_error";

				break;

			default:
				return null;
		}

		localStorage.setItem("locationError", errorMessage);

		_this._geoLocation.next({ errorMessage });
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

	async extractLocationFromLatLng(lat, lng): Promise<any> {
		const appLocation = localStorage.getItem("appLocation");

		if (appLocation) return JSON.parse(appLocation);

		const location = await this.reverseGeocodeWithOSM(lat, lng);

		if (!location) return;

		const formattedLocation = {
			lat,
			lng,
		};

		for (const key in location.address) {
			if (Object.prototype.hasOwnProperty.call(location.address, key)) {
				const value = location.address[key];

				formattedLocation[key] = value;
			}
		}

		const deviceIdentifier = this.generateUniqueId();

		formattedLocation["deviceIdentifier"] = deviceIdentifier.hash;

		formattedLocation["userAgent"] = deviceIdentifier.userAgent;

		localStorage.setItem("appLocation", JSON.stringify(formattedLocation));

		return formattedLocation;
	}

	getLead(): Lead {
		if (this.lead) return this.lead;

		const storageLead = localStorage.getItem("lead");

		if (!storageLead) return null;

		this.lead = new Lead(JSON.parse(storageLead));

		return this.lead;
	}

	setLead(data): void {
		localStorage.setItem("accessToken", data.token);

		this.lead = new Lead(data);

		localStorage.setItem("lead", JSON.stringify(this.lead));
	}

	getSession(): Session {
		if (this.session) return this.session;

		const storedSession = localStorage.getItem("session");

		if (!storedSession) return null;

		this.session = new Session(JSON.parse(storedSession));

		return this.session;
	}

	getBiggestFace(faces) {
		let maxArea = 0;

		let biggestFace;

		for (const face of faces) {
			const tempArea = face.width * face.height;

			if (tempArea > maxArea) {
				biggestFace = face;

				maxArea = tempArea;
			}
		}

		return biggestFace;
	}

	cutFaceIdCard(image, face, cardIdCanvas: HTMLCanvasElement) {
		const ctx: CanvasRenderingContext2D = cardIdCanvas.getContext("2d");

		let width = Math.ceil(face.width * 2);
		let height = Math.ceil(face.height * 2);
		let sx = Math.floor(face.x) - face.width / 2;
		let sy = Math.floor(face.y) - face.height / 2;

		if (width > image.naturalWidth) {
			width = image.naturalWidth;
			height = image.naturalHeight;
			sx = 0;
			sy = 0;
		}

		cardIdCanvas.height = height;
		cardIdCanvas.width = width;

		ctx.drawImage(image, sx, sy, width, height, 0, 0, width, height);

		return cardIdCanvas.toDataURL("image/jpeg");
	}

	setSession(data): void {
		this.session = new Session(data);

		localStorage.setItem("session", JSON.stringify(this.session));
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

	detectFace(data: any): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/face-recognition/detect/demo`, data);
	}

	compareDocumentWithSelfie(data): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/face-recognition/compare/demo`, data);
	}

	createLead(data): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/leads`, data);
	}

	createSession(data): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/liveness-sessions`, {
			...data,
		});
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
			// "session",
			// "lead",
			// "accessToken",
			"idCard",
			"idCardFaceImage",
			"sessionToken",
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

	generateUniqueId(): any {
		const navigatorInfo = window.navigator;

		const screenInfo = window.screen;

		const uniqueString = `${navigatorInfo.userAgent}-${navigatorInfo.language}-${navigatorInfo.platform}-${screenInfo.height}x${screenInfo.width}`;

		return { hash: this.simpleHash(uniqueString), userAgent: navigatorInfo.userAgent, height: screenInfo.height, width: screenInfo.width };
	}

	private simpleHash(input: string): string {
		let hash = 0;

		if (input.length === 0) {
			return hash.toString();
		}

		for (let i = 0; i < input.length; i++) {
			const char = input.charCodeAt(i);

			hash = (hash << 5) - hash + char;

			hash = hash & hash; // Convert to 32bit integer
		}

		return hash.toString();
	}

	detectEdges(faceImage) {
		const ctx = faceImage.getContext("2d");
		const imgData = ctx.getImageData(0, 0, faceImage.width, faceImage.height);
		const pixels = imgData.data;
		const width = imgData.width;
		const height = imgData.height;

		const sobelData = [];
		const kernelX = [
			[-1, 0, 1],
			[-2, 0, 2],
			[-1, 0, 1],
		];
		const kernelY = [
			[-1, -2, -1],
			[0, 0, 0],
			[1, 2, 1],
		];

		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				let pixelX =
					kernelX[0][0] * this.getPixel(pixels, x - 1, y - 1, width) +
					kernelX[0][1] * this.getPixel(pixels, x, y - 1, width) +
					kernelX[0][2] * this.getPixel(pixels, x + 1, y - 1, width) +
					kernelX[1][0] * this.getPixel(pixels, x - 1, y, width) +
					kernelX[1][2] * this.getPixel(pixels, x + 1, y, width) +
					kernelX[2][0] * this.getPixel(pixels, x - 1, y + 1, width) +
					kernelX[2][1] * this.getPixel(pixels, x, y + 1, width) +
					kernelX[2][2] * this.getPixel(pixels, x + 1, y + 1, width);

				let pixelY =
					kernelY[0][0] * this.getPixel(pixels, x - 1, y - 1, width) +
					kernelY[0][1] * this.getPixel(pixels, x, y - 1, width) +
					kernelY[0][2] * this.getPixel(pixels, x + 1, y - 1, width) +
					kernelY[1][0] * this.getPixel(pixels, x - 1, y, width) +
					kernelY[1][2] * this.getPixel(pixels, x + 1, y, width) +
					kernelY[2][0] * this.getPixel(pixels, x - 1, y + 1, width) +
					kernelY[2][1] * this.getPixel(pixels, x, y + 1, width) +
					kernelY[2][2] * this.getPixel(pixels, x + 1, y + 1, width);

				const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY) >>> 0;

				sobelData.push(magnitude, magnitude, magnitude, 255);
			}
		}

		// Edge detection threshold
		const threshold = 100;

		const edgesFound = sobelData.some((val, idx) => idx % 4 === 0 && val > threshold);

		return edgesFound;
	}

	getPixel(pixels, x, y, width) {
		const i = (y * width + x) * 4;
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		return (r + g + b) / 3; // Convert to grayscale
	}

	analyzeBlurNoise(faceImage) {
		const ctx = faceImage.getContext("2d");
		const imgData = ctx.getImageData(0, 0, faceImage.width, faceImage.height);
		const pixels = imgData.data;
		let sum = 0;
		let sumSquare = 0;

		for (let i = 0; i < pixels.length; i += 4) {
			const intensity = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
			sum += intensity;
			sumSquare += intensity * intensity;
		}

		const mean = sum / (pixels.length / 4);
		const variance = sumSquare / (pixels.length / 4) - mean * mean;

		// Set thresholds based on empirical testing
		return variance > 50 && mean > 20;
	}

	extractBackgroundImage(image, faceBox) {
		// Extract a portion of the ID that doesn't include the face
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = image.width;
		canvas.height = image.height;
		ctx.drawImage(image, 0, 0);

		// Crop out the face area (this is a basic method, more sophisticated approaches can be used)
		ctx.clearRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
		return canvas;
	}

	checkLightingConsistency(faceImage, idBackground) {
		const ctxFace = faceImage.getContext("2d");
		const ctxBackground = idBackground.getContext("2d");

		const faceData = ctxFace.getImageData(0, 0, faceImage.width, faceImage.height).data;
		const bgData = ctxBackground.getImageData(0, 0, idBackground.width, idBackground.height).data;

		const faceAvgBrightness = this.calculateAverageBrightness(faceData);
		const bgAvgBrightness = this.calculateAverageBrightness(bgData);

		return Math.abs(faceAvgBrightness - bgAvgBrightness) < 20; // Adjust threshold based on testing
	}

	calculateAverageBrightness(data) {
		let sum = 0;
		for (let i = 0; i < data.length; i += 4) {
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			sum += brightness;
		}
		return sum / (data.length / 4);
	}
}
