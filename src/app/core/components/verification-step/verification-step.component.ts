import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
    selector: "verification-step",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="verification-step">
            <div class="verification-step__label">{{ label }}</div>
            <div class="verification-step__number" [class.verification-step__number--active]="isActive" [class.verification-step__number--completed]="isCompleted">
                <div class="verification-step__number-text">{{ stepNumber }}</div>
            </div>
        </div>
    `,
    styleUrls: ["./verification-step.component.scss"]
})
export class VerificationStepComponent {
    @Input() label: string = "";
    @Input() stepNumber: number = 1;
    @Input() isActive: boolean = false;
    @Input() isCompleted: boolean = false;
}
