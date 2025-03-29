# Verifik Smart Access / Smart Enroll 

This repository provides a no-code solution for Verifik customers to utilize our APIs for Passwordless logins and KYC/AML services. Below is an overview of the services and features offered.

---

## SmartAccess

SmartAccess is a no-code solution designed to provide secure and seamless passwordless logins for users. It enables businesses to integrate various authentication methods, including email, phone, and biometric verification, without complex coding or infrastructure development.

### Key Features

1. **Passwordless Authentication**  
    SmartAccess supports multiple methods of passwordless authentication to enhance security and user experience:  
    - **Email Verification**: Sends a one-time password (OTP) to the provided email address for authentication.  
    - **Phone Verification**: Sends an OTP via SMS or WhatsApp to authenticate the user.  
    - **Biometric Authentication**: Combines facial recognition (FR) and liveness detection (LD) for secure identity verification.

2. **Flexible Configuration**  
    Businesses can configure authentication processes, including:  
    - Minimum liveness and search scores for biometric verification.  
    - Fast or accurate search options.  
    - Suggestions for biometric authentication for a smoother experience.

3. **Database Integration**  
    Easily integrate your customer database via APIs or CSV uploads. A testing feature ensures proper API configuration.

4. **Customization Options**  
    - **Logo and Image Upload**: Personalize the project with your company’s branding.  
    - **Color Customization**: Adjust the interface color scheme to match your brand identity.

5. **Team Management**  
    Invite and assign roles to team members, ensuring proper access levels for managing and monitoring the authentication process.

6. **Real-time Preview**  
    Preview the authentication process to ensure configurations and customizations meet expectations.

---

## SmartEnroll

SmartEnroll is a no-code solution for secure and seamless user onboarding. It integrates various checks, including email, phone, biometric verification, document validation, AML checks, and more, ensuring a user-friendly and secure experience.

### Key Features

1. **Sign-up Form**  
    Configure fields to collect user data during the signup process:  
    - **Full Name**: Choose between a single input field or separate fields for first and last names.  
    - **Email**: Toggle email validation.  
    - **Phone**: Choose phone verification via WhatsApp, SMS, both, or skip validation.  
    - **Terms and Privacy Policies**: Display legal agreements during signup.  
    - **Role and Company**: Optional fields for additional user information.

2. **Document Scanning**  
    Configure document verification for identity validation:  
    - **Valid Documents**: Accept government-issued IDs, passports, or driving licenses.  
    - **Attempt Limit**: Set a limit (3–10) for failed document scans.  
    - **ID Verification Methods**:  
      - Upload a digital copy of the ID.  
      - Use a device’s camera for real-time scanning.  
    - **Database Screening**:  
      - Verify IDs with government sources.  
      - Perform criminal record checks.

3. **Biometric Registration**  
    - **Attempt Limit**: Set a limit (3–10) for failed liveness detection attempts.  
    - **Liveness Score**: Customize the threshold for liveness detection (default: 50%).  
    - **Compare Score**: Set the accuracy for face-to-document matching (recommended: 85%).

4. **Connect Database**  
    Integrate external databases or upload CSV files for blacklist management:  
    - Upload a blacklist (CSV).  
    - Connect via API for dynamic blacklist management.  
    - Skip blacklist integration.

5. **Customize the Style**  
    Personalize the KYC flow’s visual elements:  
    - **Logo and Images**: Upload branding assets.  
    - **Colors**: Customize title, text, button, and background colors.  

---

Both SmartAccess and SmartEnroll ensure seamless integration and customization, empowering businesses to deliver secure and user-friendly experiences.
