# Passkeys Implementation Plan & TODO

## Overview

Implement a "Passkey" (Biometric) login flow that stores an encrypted authentication token on IPFS. This allows users to log in using their face or fingerprint in subsequent sessions without needing OTPs.

## Prerequisites

-   [x] Backend: `allowPasskeys` flag added to `ProjectFlow` model.
-   [x] SDK: `allowPasskeys` property added to `LoginSettings` interface.
-   [ ] Dependencies: Ensure packages for IPFS interaction (e.g., `ipfs-http-client` or usage of a gateway) and potentially a WebAuthn helper library (like `@simplewebauthn/browser`) are available or implemented properly using native APIs.

## TODO List

### 1. WebAuthn / Passkey Service

Create a `BiometricSecurityService` (or `PasskeyService`) to handle:

-   [ ] **Registration (Creation)**:
    -   Use `navigator.credentials.create()` to generate a new key pair.
    -   **Solution for Encryption**: Use the **PRF (Pseudo-Random Function)** feature of the native WebAuthn API.
        -   **Note**: This is **NOT** an external browser extension/plugin. It is a standard parameter (`extensions: { prf: ... }`) passed to the browser's native `navigator.credentials` function.
        -   **Why**: It allows the authenticator (FaceID/TouchID) to output a deterministic **Secret Key** along with the login signature. We need this Secret Key to encrypt the token before sending it to IPFS.
        -   **Multi-Device Strategy**: We do **not** rely on iCloud/Google sync. Instead, IPFS is the storage layer.
        -   **Workflow**:
            -   **Device A**: Register Biometric -> Derive Key A -> Encrypt Token -> Upload `passKey_A` to IPFS.
            -   **Device B (First Time)**: User logs in via OTP. We prompt to "Add this Device". Register Biometric -> Derive Key B -> Encrypt Token -> Upload `passKey_B` to IPFS.
            -   **Device B (Subsequent)**: Fetch `passKey_B` from IPFS -> Decrypt with Biometric B -> Login.
        -   **Key Usage**: The derived PRF Key acts as the symmetric key to encrypt/decrypt the payload stored on IPFS.
        -   **Mechanism (Zero-Knowledge)**:
            -   We do **NOT** ask the backend to "generate" a new token upon login.
            -   Instead, the biometric check unlocks the key -> The key decrypts the **existing** JWT/Token stored inside the IPFS file.
            -   The user is logged in because they successfully recovered their own valid credentials.
-   [ ] **Authentication (Get)**:
    -   Use `navigator.credentials.get()` to prompt for biometrics.
    -   Retrieve the derived key (via PRF) or signature.

### 2. IPFS Integration (via ZelfKey)

-   [ ] **Backend Update**:
    -   Modify `createMetadataAndPublicData` in `Repositories/ZelfKey/modules/zelf-key.module.js`:
        -   Add `case "passKeys":`.
        -   structure: `metadata: { ... }, publicData: { type: "passKeys", ... }`.
    -   Ensure `storeData` handles `type: "passKeys"` (routing it to `_store`).
    -   Update `listData` allowed categories to include `"passKeys"`.
-   [ ] **SDK Update**:
    -   Implement `PasskeyZelfService`:
-   [ ] **SDK Update**:
    -   Implement `PasskeyZelfService`:
        -   **Upload (Create)**: Call `POST /api/zelf-key/store` (maps to `Controller.storeData`).
            -   Payload: `{ type: "passKeys", faceBase64: ..., zelfProof: ..., ... }`.
        -   **List (Check Existence)**: Call `GET /api/zelf-key/list` (maps to `Controller.listData`).
            -   Query: `?category=passKeys`.
        -   **Retrieve (Decrypt)**: Call `POST /api/zelf-key/retrieve` (maps to `Controller.retrieveData`).
            -   Payload: `{ zelfProof: ..., faceBase64: ..., password: ... }`.
    -   Method `createPasskey(data: any): Promise<any>`
        -   Call `POST /api/zelf-key/store`.
    -   Method `getListPasskeys(data: any): Promise<any>`
        -   Call `GET /api/zelf-key/list`.
    -   Method `getPasskey(data: any): Promise<any>`
        -   Call `POST /api/zelf-key/retrieve`.

### 3. Encryption/Decryption Logic

-   [ ] Implement AES-GCM encryption using the Web Crypto API.
    -   Key: Derived from the Biometric step (PRF output).
    -   Data: The `appLoginToken` (JWT) received after OTP validation.

### 4. Update `AuthSignInComponent` (`sign-in.component.ts`)

#### A. Registration Flow (After OTP)

-   [ ] In `_signInWithEmail` and `_signInWithPhone`, after successful token retrieval:
    -   Check if `this.projectFlow.loginSettings.allowPasskeys` is `true`.
    -   If `true`, pause the auto-redirect (`successLogin`).
    -   **UI**: Show a modal/prompt: "Would you like to enable Biometric Login for faster access?".
    -   **Logic**:
        -   If User accepts:
            1. Call `PasskeyService.register()`.
            2. Derive Key.
            3. Encrypt `appLoginToken`.
            4. Construct Filename: `{email}_{{projectId}}.zelfKeys` or `{phone}_{{projectId}}.zelfKeys`.
            5. Upload encrypted data to IPFS.
            6. Save the IPFS CID or just rely on the predictable filename + IPNS (if applicable) or backend mapping? _User said "name {{email}}...zelfKeys", implying we might fetch it by name if we have a mutable pointer or a specific bucket._
        -   If User declines or fails: Proceed to `successLogin`.

#### B. Login Flow (Initialization)

-   [ ] In `ngOnInit` or `initForm`:
    -   Construct the expected Filename: `{email/phone}_{{projectId}}.zelfKeys`. (Ref: We need the email/phone _first_. This implies we check _after_ the user types their email/phone but _before_ sending OTP?)
    -   **UX Adjustment**: When user enters Email/Phone and clicks "Continue":
        1. Check if `{email}_{{projectId}}.zelfKeys` exists (via IPFS Gateway lookup).
        2. If Exists:
            - Show "Login with Face/Touch ID" button.
            - On Click -> `PasskeyService.authenticate()`.
            - Decrypt the file content.
            - If success -> `successLogin(decryptedToken)`.
        3. If Not Exists -> Proceed with standard OTP flow.

### 6. Token Lifecycle & Rotation

-   [ ] **Long-Lived Token**:
    -   Ensure the token encrypted is valid for a long duration (e.g., 1 Year).
    -   Backend may need a specific flag (e.g., `scope: "passkey"`) to issue this.
-   [ ] **Auto-Renewal (Rotation)**:
    -   **Trigger**: Upon successful Passkey login (decryption).
    -   **Check**: Decode the decrypted token JWT. Check `exp`.
    -   **Action**: If token is expiring soon (e.g., < 30 days) or as a general security practice:
        1. Call Backend to **Refresh** the token (exchange old valid token for new 1-year token).
        2. **Re-Encrypt** the _new_ token with the _same_ Biometric Key (currently in memory).
        3. **Update IPFS**: Call `PasskeyZelfService.createPasskey` (overwrite) with the new encrypted blob.
    -   **Result**: Self-healing credential that doesn't expire for active users.

### 7. Maintenance & Cleanup

-   [ ] **Passkey Expiration**:
    -   Save `expiresAt` in passkey metadata during registration and rotation.
    -   Create a mechanism (backend job or frontend check) to identify and delete/revoke passkeys that are no longer usable or have exceeded a certain age limit (e.g. 24 months for Verifik project).
