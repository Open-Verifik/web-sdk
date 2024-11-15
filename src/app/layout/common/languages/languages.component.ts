import { Subscription } from "rxjs";

import { CommonModule, NgFor, NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";

import { AvailableLangs, TranslocoService } from "@ngneat/transloco";

import { MatIconModule } from "@angular/material/icon";

@Component({
	selector: "languages",
	templateUrl: "./languages.component.html",
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "languages",
	styleUrls: ["languages.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatIconModule,
		MatMenuModule,
		NgFor,
		NgTemplateOutlet,
	],
})
export class LanguagesComponent implements OnInit, OnDestroy {
	private _languageSubscription: Subscription;

	activeLang: string;
	availableLangs: AvailableLangs;
	flagCodes: any;
	open: boolean = false;

	constructor(private _translocoService: TranslocoService) {}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this.availableLangs = this._translocoService.getAvailableLangs();

		const currentLanguage = localStorage.getItem("currentLanguage");

		if (currentLanguage) {
			this._translocoService.setActiveLang(currentLanguage);
		}

		this._languageSubscription = this._translocoService.langChanges$.subscribe((activeLang) => {
			this.activeLang = activeLang;
		});

		this.flagCodes = {
			en: "us",
			es: "es",
			br: "br",
			fr: "fr",
			it: "it",
			ru: "ru",
			kr: "kr",
			in: "in",
			cn: "cn",
			ph: "ph",
		};
	}

	ngOnDestroy(): void {
		this._languageSubscription.unsubscribe();
	}

	setActiveLang(lang: string): void {
		this._translocoService.setActiveLang(lang);

		localStorage.setItem("currentLanguage", lang);
	}

	trackByFn(index: number, item: any): any {
		return item.id || index;
	}
}
