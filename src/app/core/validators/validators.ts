import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class CoreValidators {
    /**
     * Check for empty (optional fields) values
     *
     * @param value
     */
    static isEmptyInputValue(value: any): boolean {
        return value == null || value.length === 0;
    }

    /**
     * Required if project flow version is 3 validator
     *
     * @param projectFlowVersion The version number of the project flow
     */
    static requiredIfVersion3(projectFlowVersion: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            // If project flow version is 3, the field is required
            if (projectFlowVersion === 3) {
                if (this.isEmptyInputValue(control.value)) {
                    return { requiredIfVersion3: true };
                }
            }

            return null;
        };
    }

    /**
     * Required if condition is true validator
     *
     * @param condition The condition that determines if the field is required
     * @param errorKey The error key to return when validation fails (default: 'requiredIf')
     */
    static requiredIf(condition: boolean, errorKey: string = 'requiredIf'): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            // If condition is true, the field is required
            if (condition) {
                if (this.isEmptyInputValue(control.value)) {
                    return { [errorKey]: true };
                }
            }

            return null;
        };
    }

    /**
     * Required if another field has a specific value
     *
     * @param fieldName The name of the field to check
     * @param expectedValue The expected value of the field
     * @param errorKey The error key to return when validation fails (default: 'requiredIfField')
     */
    static requiredIfField(fieldName: string, expectedValue: any, errorKey: string = 'requiredIfField'): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const formGroup = control.parent;
            if (!formGroup) {
                return null;
            }

            const field = formGroup.get(fieldName);
            if (!field) {
                return null;
            }

            // If the field has the expected value, this field is required
            if (field.value === expectedValue) {
                if (this.isEmptyInputValue(control.value)) {
                    return { [errorKey]: true };
                }
            }

            return null;
        };
    }

    /**
     * Must match validator
     *
     * @param controlPath A dot-delimited string values that define the path to the control.
     * @param matchingControlPath A dot-delimited string values that define the path to the matching control.
     */
    static mustMatch(controlPath: string, matchingControlPath: string): ValidatorFn {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            // Get the control and matching control
            const control = formGroup.get(controlPath);
            const matchingControl = formGroup.get(matchingControlPath);

            // Return if control or matching control doesn't exist
            if (!control || !matchingControl) {
                return null;
            }

            // Delete the mustMatch error to reset the error on the matching control
            if (matchingControl.hasError("mustMatch")) {
                delete matchingControl.errors.mustMatch;
                matchingControl.updateValueAndValidity();
            }

            // Don't validate empty values on the matching control
            // Don't validate if values are matching
            if (this.isEmptyInputValue(matchingControl.value) || control.value === matchingControl.value) {
                return null;
            }

            // Prepare the validation errors
            const errors = { mustMatch: true };

            // Set the validation error on the matching control
            matchingControl.setErrors(errors);

            // Return the errors
            return errors;
        };
    }
}
