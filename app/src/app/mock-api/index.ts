// import { MockApi } from 'app/mock-api/api'
import { AppRegistrationMockApi } from './app-registration-mock';
import { BiometricMockApi } from './biometrics-mock';
import { EmailValidationMockApi } from './email-validation-mock';
import { PhoneValidationMockApi } from './phone-validation-mock';


export const mockApiServices = [
    // MockApi,
    AppRegistrationMockApi,
    PhoneValidationMockApi,
    EmailValidationMockApi,
    BiometricMockApi
];
