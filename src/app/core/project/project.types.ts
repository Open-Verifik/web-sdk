export interface ProjectConfig
{
    bgColor: string;
    borderColor: string;
    txtColor: string;
    titleColor: string;
    logo: string;
}

export interface ProjectFlow
{
    email: boolean;
    emailAuthy: boolean;
    phone: boolean;
    phoneAuthy: boolean;
    phoneGateway: string;
    faceLiveness: boolean;
    faceLivenessAuthy: boolean;
    documentValidation: boolean;
    appQRCode: boolean;
    webAuthN: boolean;
}



export interface Project
{
    allowedCountries: [string];
    projectConfig: ProjectConfig;
    projectFlow: ProjectFlow;
}
