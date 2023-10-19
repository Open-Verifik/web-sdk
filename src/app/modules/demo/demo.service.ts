import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class DemoService {
	navigation: any;
	demoData: any;

	constructor() {
		this.initNavigation();
		this.initDemoData();
	}

	getNavigation(): any {
		return this.navigation;
	}

	initNavigation(): void {
		this.navigation = {
			currentStep: 3,
			lastStep: 5,
		};
	}

	getDemoData(): any {
		return this.demoData;
	}

	initDemoData(): void {
		this.demoData = {
			document: {},
		};
	}

	setDemoDocument(document: any): void {
		this.demoData.document = document;
	}

	moveToStep(step: number): void {
		if (step > this.navigation.lastStep) return;

		if (step <= 0) return;

		this.navigation.currentStep = step;

		console.log({
			step,
		});
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
		const latitude = position.coords.latitude;
		const longitude = position.coords.longitude;
		console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
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

			if (data && data.display_name) {
				return data;
			}

			return null;
		} catch (error) {
			console.error("Error during reverse geocoding with OSM:", error);
			return null;
		}
	}
}
