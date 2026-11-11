import { CommonModule } from "@angular/common";
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { TranslocoModule } from "@ngneat/transloco";
import QRCode from "qrcode";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import { CompanyRepresentative } from "../verify-business.types";

@Component({
	selector: "business-rep-kyc-modal",
	standalone: true,
	imports: [CommonModule, TranslocoModule],
	templateUrl: "./business-rep-kyc-modal.component.html",
	styleUrls: ["./business-rep-kyc-modal.component.scss"],
})
export class BusinessRepKycModalComponent implements OnInit, AfterViewChecked, OnDestroy {
	@ViewChild("qrCanvas") qrCanvas?: ElementRef<HTMLCanvasElement>;

	activeTab: "inline" | "qr" | "sms" = "qr";
	linkCopied = false;
	inviteSent = false;
	sendingChannel: "email" | "phone" | null = null;
	lastSentChannel: "email" | "phone" | null = null;
	private _renderedQrUrl = "";
	private _renderedQrCanvas: HTMLCanvasElement | null = null;

	constructor(
		public session: VerifyBusinessSessionService,
		private _cdr: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		if (this.session.activeRepForKyc) {
			this.session.startPollingRepKyc();
		}
	}

	ngAfterViewChecked(): void {
		const canvasEl = this.qrCanvas?.nativeElement;
		if (this.activeTab === "qr" && canvasEl) {
			const url = this.repKycUrl;
			if (this._renderedQrUrl !== url || this._renderedQrCanvas !== canvasEl) {
				this._renderedQrUrl = url;
				this._renderedQrCanvas = canvasEl;
				void QRCode.toCanvas(canvasEl, url, {
					width: 200,
					margin: 1,
					color: {
						dark: "#0e0f0c",
						light: "#ffffff",
					},
				});
			}
		}
	}

	ngOnDestroy(): void {
		this.session.stopPolling();
	}

	get rep(): CompanyRepresentative | null {
		return this.session.activeRepForKyc;
	}

	get repKycUrl(): string {
		const repToken =
			this.rep?.kycToken || this.rep?.kycAppRegistration || this.rep?._id || this.session.token || "";
		return `${window.location.origin}/verify/${this.session.projectId}?token=${encodeURIComponent(repToken)}&rep=1&handoff=1`;
	}

	copyLink(): void {
		navigator.clipboard.writeText(this.repKycUrl).then(() => {
			this.linkCopied = true;
			this._cdr.detectChanges();
			setTimeout(() => {
				this.linkCopied = false;
				this._cdr.detectChanges();
			}, 3000);
		});
	}

	sendInvite(channel: "email" | "phone"): void {
		if (!this.rep || this.sendingChannel) return;
		this.sendingChannel = channel;
		this.inviteSent = false;
		this._cdr.detectChanges();

		this.session.dispatchRepInvite(this.rep, channel).subscribe({
			next: (ok) => {
				this.sendingChannel = null;
				if (ok) {
					this.inviteSent = true;
					this.lastSentChannel = channel;
					this._cdr.detectChanges();
					setTimeout(() => {
						this.inviteSent = false;
						this._cdr.detectChanges();
					}, 5000);
				} else {
					this._cdr.detectChanges();
				}
			},
			error: () => {
				this.sendingChannel = null;
				this._cdr.detectChanges();
			},
		});
	}

	openInlineWindow(): void {
		window.open(this.repKycUrl, "_blank", "width=480,height=720");
	}

	close(): void {
		this.session.closeKycModal();
	}
}
