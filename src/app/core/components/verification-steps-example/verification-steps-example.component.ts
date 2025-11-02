import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { VerificationStepComponent } from "../verification-step/verification-step.component";

@Component({
    selector: "verification-steps-example",
    standalone: true,
    imports: [CommonModule, VerificationStepComponent],
    template: `
        <div class="p-6 space-y-8">
            <h2 class="text-2xl font-bold mb-6">Verification Steps Example</h2>
            
            <!-- Single Step Example -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold">Single Step</h3>
                <verification-step 
                    label="Verification method"
                    [stepNumber]="1"
                    [isActive]="true">
                </verification-step>
            </div>

            <!-- Multiple Steps Example -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold">Multiple Steps</h3>
                <div class="flex flex-wrap gap-6 justify-center">
                    <verification-step 
                        label="Verification method"
                        [stepNumber]="1"
                        [isCompleted]="true">
                    </verification-step>
                    
                    <verification-step 
                        label="Document upload"
                        [stepNumber]="2"
                        [isActive]="true">
                    </verification-step>
                    
                    <verification-step 
                        label="Identity verification"
                        [stepNumber]="3"
                        [isActive]="false">
                    </verification-step>
                </div>
            </div>

            <!-- Horizontal Steps Example -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold">Horizontal Steps</h3>
                <div class="flex items-center justify-center space-x-8">
                    <verification-step 
                        label="Step 1"
                        [stepNumber]="1"
                        [isCompleted]="true">
                    </verification-step>
                    
                    <div class="w-8 h-0.5 bg-gray-300"></div>
                    
                    <verification-step 
                        label="Step 2"
                        [stepNumber]="2"
                        [isActive]="true">
                    </verification-step>
                    
                    <div class="w-8 h-0.5 bg-gray-300"></div>
                    
                    <verification-step 
                        label="Step 3"
                        [stepNumber]="3"
                        [isActive]="false">
                    </verification-step>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class VerificationStepsExampleComponent {}
