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
}
