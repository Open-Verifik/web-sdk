import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslocoModule } from "@ngneat/transloco";
import { environment } from "environments/environment";

@Component({
    selector: "auth-biometric-errors-display",
    templateUrl: "./auth-biometric-errors-display.component.html",
    styleUrls: ["./auth-biometric-errors-display.component.scss"],
    imports: [CommonModule, FlexLayoutModule, TranslocoModule, MatIconModule, MatButtonModule],
    standalone: true,
})
export class AuthBiometricErrorsDisplayComponent implements OnInit {
    @Input() errorContent: any;
    @Input() project: any;
    @Input() projectFlow: any;
    @Input() callback: any;
    @Input() appLoginToken: any;

    ngOnInit(): void {
        if (!this.errorContent) return;

        const split = this.errorContent.message.split("@");

        this.errorContent.message = split[0];

        this.errorContent.livenessScore = Math.round(Number(split[1] * 100 || 0));
    }

    callbackFunction(): void {
        if (["person_not_found", "liveness_failed"].includes(this.errorContent.message)) {
            window.location.reload();

            return;
        }

        let redirectUrl = this.projectFlow.redirectUrl;

        // check the origin of the request (if we are staging-access.verifik.co, access.verifik.co or testing-access.verifik.co)
        const origin = window.location.origin;

        if (origin.includes("staging-access.verifik.co")) {
            redirectUrl = `${environment.stagingUrl}/sign-in`;
        } else if (origin.includes("access.verifik.co")) {
            redirectUrl = `${environment.appUrl}/sign-in`;
        } else if (origin.includes("testing-access.verifik.co")) {
            redirectUrl = `${environment.sandboxUrl}/sign-in`;
        }

        window.location.href = `${redirectUrl}?type=login&token=${this.appLoginToken}`;
    }
}
