# Verifik Smart Access / Smart Enroll 

This repository is dedicated to build a solution no-code for our customers in Verifik so they can utilize our APIs that covers majority of our services in a form of a project to do Passwordless logins and KYC/AML service.

We will start by listing what services we utilize on each flow

## SmartAccess

SmartAccess is a no-code solution designed to provide secure and seamless passwordless logins for users. This platform enables businesses to offer various authentication methods, including email, phone, and biometric verification, ensuring a user-friendly and secure experience. With SmartAccess, companies can easily integrate these authentication methods without the need for complex coding or infrastructure development.

### Key Features

    1. Passwordless Authentication
SmartAccess supports multiple methods of passwordless authentication to enhance security and user experience:

        * Email Verification: Once an email address is provided, a one-time password (OTP) is sent to the email provider to authenticate the end user.

        * Phone Verification: Once a phone number is provided, a one-time password (OTP) is sent via SMS or WhatsApp to authenticate the end user.

        * Biometric Authentication: By combining facial recognition (FR) and liveness detection (LD), users can safely verify their identity and give proof of humanity. 

    2. Flexible Configuration

        SmartAccess allows businesses to configure the authentication process to their specific needs. Configure the minimum liveness and search scores for biometric verification, choose between fast or accurate search options, and can also suggest end users to do Biometric Authentication for a smoother experience.

    3. Database Integration

        Integrating your existing customer database with SmartAccess is straightforward. Businesses can connect their databases through APIs or upload customer data using CSV files. The platform also provides a testing feature to ensure the API connection is correctly configured.
    
    4. Customization Options

        SmartAccess offers extensive customization options to match your branding requirements:

        Logo and Image Upload: Personalize the project by uploading your company’s logo and relevant images.

        Color Customization: Adjust the color scheme of the authentication interface to align with your brand’s identity.

    5. Team Management

        SmartAccess includes a simple yet effective team management system, allowing project owners to invite and assign roles to team members within the platform. This ensures that the right people have the right access levels to manage and monitor the authentication process.

    6. Real-time Preview

        Businesses can preview how their authentication process will look to end-users before finalizing the setup, ensuring that all configurations and customizations meet their expectations.


## SmartEnroll

SmartEnroll is a no-code solution designed to provide secure and seamless onboardings for users. This platform enables businesses to offer various onboarding checks, including email, phone, and biometric verification, document validations, AML checks, tempering checks and more. All those features are integrated into our project ensuring a user-friendly and secure experience. With SmartEnroll, companies can easily integrate these KYC solutions without the need for complex coding or infrastructure development.

### Key Features

    1. Sign up Form

        In this step, users configure the fields they want to collect from end-users during the signup process.
        
        **Full Name:** The system allows for flexibility in how names are captured. Users can choose between:
        
        First and last names together (a single input field).
        
        First and last names separated (two distinct input fields for each part of the name).
        
        **Email:** You can opt to validate the email address by toggling between "Validate" or "Don't validate."

        **Phone:** Users can decide if phone verification will be done via:
            WhatsApp
            SMS
            Both (WhatsApp and SMS)
            Don't validate (skip phone number validation).

        **Show Terms and Conditions:** A toggle to display Terms and Conditions to the end-users during the signup process.

        **Show Privacy Policies:** Similar to the Terms and Conditions, this toggle will show privacy policies at the signup stage.
        
        **Role and Company:** The platform allows users to ask for additional optional fields like Role and Company information. These fields are toggled on or off based on the business's needs.
        
        **Key Note:** This step provides flexibility in data collection while ensuring necessary legal agreements (Terms & Privacy Policies) are presented to the user.

    2. Document Scanning

        In this step, the user can configure document verification for identity validation.

        **Valid Documents:** The platform supports scanning and verifying various government-issued documents. Users can select which types of documents are acceptable for their KYC process. Options typically include:
            * Government Identity Document
            * Passport
            * Driving License

        
        **Set an Attempt Limit:** This allows users to define how many failed document scans are permitted before the process is locked. The range is customizable, from 3 up to 10 attempts. This is critical for controlling potential fraudulent attempts and ensuring efficient resource use.

        **ID Verification Methods:**
            Option 1: Upload a digital copy of an ID document.
            Option 2: Use the device’s camera to scan the physical ID for real-time verification.
        
        **Data Base Screening:** Additional checks can be done against government databases. Users can add:
        
        **ID Verification with Government Sources:** Compares the extracted information with official records to verify the authenticity of the document.
        
        **Criminal Record Check:** Queries databases to see if the individual has a criminal record.
        Key Note: This step is where the user sets up verification methods to authenticate documents with an additional layer of security via external checks.

    3. Biometric Registration

        **Biometric Registration:** This is the biometric verification part of the flow, where a user’s face is checked to confirm their presence during the onboarding process.

        **Set an Attempt Limit:** Specifies how many times a user can fail liveness detection before being blocked from continuing. The allowed attempts can be customized from 3 to 10.

        **Liveness Score:** Customize the threshold for liveness detection. This score determines how stringent the system is in verifying that the biometric input is from a live person, not a static image or video. The default recommendation is 50%, which ensures the liveness check works optimally on most devices.

        **Compare Score:** This score sets the accuracy of comparing (1:1) the face of the end user to the document provided. A higher score means an more security,  stricter matching criteria, and demands a higher resemblance to the user in order to gain access. The recommended score for optimal performance is 85%. 

    4. Connect Database

        This step is critical for integrating your KYC process with external databases or using CSV files for lists, such as blacklists. This step offers flexibility based on the size, type, and frequency of updates to your data.
        
        Blacklist Management:
            * Upload a Blacklist (CSV)
            * Connect with API: Dynamic Blacklist Management
            * No blacklist

    5. Customize the Style
        This section enables full customization of the KYC flow’s visual elements:
        
        Logo: Users can upload their company logo, which will be displayed throughout the KYC process.
        
        Image: Users can upload additional images to accompany the KYC flow for a more personalized experience.
        
        Colors: The interface allows users to select a color scheme to match their brand identity. Customizations include:
            Title Color
            Text Color
            Button Color
            Background Color
            Right Background Color (for specific UI components).
            and more.

        Key note: Customization ensures that the Verifik Client App seamlessly aligns with the user’s branding guidelines.