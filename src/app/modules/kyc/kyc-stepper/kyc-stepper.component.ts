import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule } from "@ngneat/transloco";
import { KYCService } from "app/modules/auth/kyc.service";
import { Project, ProjectFlow } from "app/modules/auth/project";
import { Subject, takeUntil } from "rxjs";

@Component({
	selector: "kyc-stepper",
	standalone: true,
	templateUrl: "./kyc-stepper.component.html",
	styleUrls: ["./kyc-stepper.component.scss"],
	imports: [FlexLayoutModule, CommonModule, MatDialogModule, TranslocoModule, MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule],
})
export class KycStepperComponent implements OnInit {
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	navigation: any;
	steps: any;
	phoneMode: boolean;
	tabletMode: boolean;
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	constructor(
		private _KYCService: KYCService,
		private _splashScreenService: FuseSplashScreenService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _fuseMediaWatcherService: FuseMediaWatcherService
	) {
		this._ObserveDomMedia();

		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.navigation = this._KYCService.getNavigation();
	}

	ngOnInit(): void {
		this.steps = [];

		for (let index = 0; index < this.navigation.displayableSteps.length; index++) {
			const step = this.navigation.displayableSteps[index];

			if (step.code === "end") step.code = "documentLivenessReview";

			this.steps.push(step);
		}
	}

	_ObserveDomMedia(): void {
		this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => {
			this.phoneMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && !matchingAliases.includes("sm"));

			this.tabletMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && matchingAliases.includes("sm"));

			this._changeDetectorRef.markForCheck();
		});
	}
}
