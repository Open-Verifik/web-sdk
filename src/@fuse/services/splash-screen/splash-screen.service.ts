import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter, take } from "rxjs";

@Injectable({ providedIn: "root" })
export class FuseSplashScreenService {
	_element: HTMLElement;
	_imageElement: HTMLImageElement;

	/**
	 * Constructor
	 */
	constructor(@Inject(DOCUMENT) private _document: any, private _router: Router) {
		this._element = this._document.body.querySelector('fuse-splash-screen');
		this._imageElement = this._element.querySelector('img');

		// Hide it on the first NavigationEnd event
		this._router.events
			.pipe(
				filter((event) => event instanceof NavigationEnd),
				take(1)
			)
			.subscribe(() => {
				this.hide();
			});
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Public methods
	// -----------------------------------------------------------------------------------------------------

	/**
	 * Show the splash screen
	 */
	show(): void {
		this._document.body.classList.remove("fuse-splash-screen-hidden");
	}

	/**
	 * Hide the splash screen
	 */
	hide(): void {
		this._document.body.classList.add("fuse-splash-screen-hidden");
	}

	setLogo(imgUrl: string): void {
		this._imageElement.src = imgUrl;
	}

	resetLogo(): void {
		this._imageElement.src = "https://cdn.verifik.co/LogoHorizontalBlanco.svg";
	}

	setBackgroundColor(color: string): void {
		this._element.style.backgroundColor = color;
	}

	resetBackgroundColor(): void {
		this._element.style.backgroundColor = '';
	}
}
