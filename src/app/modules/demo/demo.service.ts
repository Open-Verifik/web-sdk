import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class DemoService {
	navigation: any;

	constructor() {
		this.initNavigation();
	}

	getNavigation(): any {
		return this.navigation;
	}

	initNavigation(): any {
		this.navigation = {
			currentStep: 2,
			lastStep: 5,
		};
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
