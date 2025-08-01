import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslocoModule } from "@ngneat/transloco";
import { environment } from "environments/environment";
import { AuthService } from "app/core/auth/auth.service";

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

    constructor(private _authService: AuthService) {}

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

        this._authService.handleRedirect(this.projectFlow, this.project._id, this.appLoginToken, "login");
    }
}
