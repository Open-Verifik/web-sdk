import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, takeUntil } from "rxjs";

@Component({
	selector: "demo-results",
	templateUrl: "./demo-results.component.html",
	styleUrls: ["./demo-results.component.scss", "../demo-root/demo-root.component.scss", "../id-details/id-details.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, MatButtonModule, CommonModule, MatProgressSpinnerModule, TranslocoModule],
})
export class DemoResultsComponent implements OnInit, OnDestroy, AfterViewInit {
	demoData: any;
	generalInfoLoaded: boolean;
	locationLoaded: boolean;
	@ViewChild("liveness", { static: false }) liveness: ElementRef;
	@ViewChild("compare", { static: false }) compare: ElementRef;
	locationLoading: boolean;
	documentFrontSideUrl: string;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	lang: string;
	h2MaxHeight: any;

	constructor(
		private _demoService: DemoService,
		private _changeDetectorRef: ChangeDetectorRef,
		private transloco: TranslocoService,
		private el: ElementRef
	) {
		this.demoData = this._demoService.getDemoData();

		this.generalInfoLoaded = false;

		this.locationLoaded = false;

		this.locationLoading = false;

		this.documentFrontSideUrl = this.demoData.pro?.url || this.demoData.studio?.url || this.demoData.prompt?.url;

		this.transloco.langChanges$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
			this.lang = result;
			if (this.liveness && this.liveness.nativeElement && this.compare && this.compare.nativeElement) {
				const livenessHeight = this.liveness.nativeElement.offsetHeight;
				const comparesHeight = this.compare.nativeElement.offsetHeight;
				this.h2MaxHeight = livenessHeight > comparesHeight ? livenessHeight : comparesHeight;
				this._changeDetectorRef.markForCheck();
			}
		});
	}

	ngAfterViewInit() {
		setTimeout(() => {
			if (this.liveness && this.liveness.nativeElement && this.compare && this.compare.nativeElement) {
				const livenessHeight = this.liveness.nativeElement.offsetHeight;

				const comparesHeight = this.compare.nativeElement.offsetHeight;

				this.h2MaxHeight = livenessHeight > comparesHeight ? livenessHeight : comparesHeight;

				this._changeDetectorRef.markForCheck();
			}
		}, 300);
	}

	ngOnInit(): void {
		if (!this.demoData.liveness?._id && localStorage.getItem("liveness")) {
			this._getLivenessData();
		}

		this._changeDetectorRef.markForCheck();

		if (!this.demoData.liveness?._id) {
			this._demoService.moveToStep(1);

			return;
		}
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.complete();
	}

	_getLivenessData(): void {
		let liveness = localStorage.getItem("liveness");

		if (liveness) {
			this.demoData.liveness = JSON.parse(liveness);

			this.demoData.livenessResult = JSON.parse(localStorage.getItem("livenessResult"));

			return;
		}

		this._demoService.moveToStep(1);
	}

	hasLocation(): boolean {
		if (this.locationLoaded && this.demoData.lat && this.demoData.lng) return true;

		if (this.locationLoading || !this.demoData.lat || !this.demoData.lng) {
			return false;
		}
	}

	hasGeneralInformation(): boolean {
		if (this.generalInfoLoaded) return true;

		if (this.demoData.generalInformation.length) {
			this.generalInfoLoaded = true;

			return this.generalInfoLoaded;
		}
	}

	restartDemo(): void {
		this._demoService.cleanVariables();

		this._demoService.moveToStep(1);
	}

	ObjectEmpty(data): boolean {
		return Boolean(Object.keys(data).length > 0);
	}
}
