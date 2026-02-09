# Name Mismatch UX Improvement

## Problem Statement
When name verification fails (names don't match), users were stuck with:
- ❌ Disabled Continue button with no explanation
- ❌ No way to proceed with the registration
- ❌ No visibility into WHY names don't match
- ❌ No understanding of what to do next
- ❌ Poor UX - user feels blocked and confused

## Solution Implemented

### User-Friendly Name Mismatch UI

When names don't match between the document and official records, the system now:

1. **Shows detailed match percentages**
   - Full Name Match: X%
   - First Name Match: Y%
   - Last Name Match: Z%

2. **Explains the issue clearly**
   - "The names on your document don't exactly match the official records"
   - "This could be due to formatting, middle names, or data entry differences"

3. **Provides a path forward**
   - "Proceed with Manual Verification" button
   - Clear messaging about what will happen next
   - Allows user to continue the registration flow

4. **Triggers manual verification**
   - Marks the case for admin review
   - Updates status to `NEEDS_MANUAL_VERIFICATION`
   - Sends webhook notification to admin
   - Allows user to proceed with next steps

## UI Design

### Name Mismatch Banner
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Name Verification Issue Detected                        │
│                                                              │
│ The names on your document don't exactly match the          │
│ official records. This could be due to formatting,          │
│ middle names, or data entry differences.                    │
│                                                              │
│ ┌────────────────────────────────────────────────┐          │
│ │ Full Name Match:       85%                      │          │
│ │ First Name Match:      92%                      │          │
│ │ Last Name Match:       78%                      │          │
│ └────────────────────────────────────────────────┘          │
│                                                              │
│ You can proceed by requesting manual verification.          │
│ An administrator will review your case.                     │
│                                                              │
│ ┌────────────────────────────────────────────────┐          │
│ │   Proceed with Manual Verification              │          │
│ └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Component Method
**File**: `src/app/modules/auth/smart-enroll/smart-documents-review/smart-documents-review.component.ts`

```typescript
proceedWithManualVerification(): void {
    if (!this.appRegistration?.documentValidation?._id) return;

    // Show loading state
    this.loading.nameValidation = true;

    this._KYCService.setDocumentValidationManualVerification({
        _id: this.appRegistration.documentValidation._id,
        reason: "name_mismatch",
        timeoutType: "nameValidation",
        elapsedTime: 0,
    }).subscribe({
        next: (response) => {
            // Update local state
            if (response?.data) {
                this.appRegistration.documentValidation.status = response.data.status;
            }

            // Show manual verification banner
            this.showManualVerificationBanner = true;
            this.manualVerificationMessage = this._translocoService.translate(
                "smart_enroll.name_mismatch_manual_review"
            );

            // Clear the name match error so user can continue
            delete this.errors.namesDoNotMatch;
            this.showErrors = Object.keys(this.errors).length > 0;

            this.loading.nameValidation = false;

            // Allow user to continue
            this._smartEnrollService.goToNextStep();
        },
        error: (error) => {
            console.error("Failed to set manual verification:", error);
            this.loading.nameValidation = false;
        },
    });
}

hasNameMismatch(): boolean {
    return (
        this.projectFlow.onboardingSettings.document.verifyNames &&
        this.appRegistration?.documentValidation?.infoValidationSupported &&
        !this.appRegistration?.documentValidation?.namesMatch &&
        !this.loading.nameValidation
    );
}
```

### Template Changes
**File**: `src/app/modules/auth/smart-enroll/smart-documents-review/smart-documents-review.component.html`

- Added name mismatch banner with match percentages
- Added "Proceed with Manual Verification" button
- Shows automatically when `hasNameMismatch()` returns true
- Hidden when manual verification banner is already showing

## User Flow

### Before Fix
```
Document Review Screen
  ↓
Name verification fails (85% match)
  ↓
Continue button disabled
  ↓
User sees: "Names do not match" error
  ↓
❌ USER IS STUCK - No way to proceed
```

### After Fix
```
Document Review Screen
  ↓
Name verification fails (85% match)
  ↓
Continue button disabled
  ↓
User sees: Name Mismatch Banner with:
  - Clear explanation
  - Match percentages (85% full, 92% first, 78% last)
  - "Proceed with Manual Verification" button
  ↓
User clicks button
  ↓
System:
  - Marks for manual verification
  - Updates status to NEEDS_MANUAL_VERIFICATION
  - Sends webhook to admin
  - Shows success banner
  - Navigates to next step
  ↓
✅ USER CAN CONTINUE - Registration proceeds
```

## Debug Information Enhancement

Also added comprehensive debug panel that shows:
- All blocking reasons in plain English
- Current validation states
- Document validation details
- Name match percentages
- Project flow configuration

This helps both users and developers understand what's blocking the Continue button.

## Backend Integration

Uses the existing manual verification endpoint:
- **Endpoint**: `PUT /v2/document-validations/:id/manual-verification`
- **Reason**: `"name_mismatch"`
- **TimeoutType**: `"nameValidation"`
- **Triggers**: Webhook event `document_validation_manual_verification_required`

## Common Scenarios Handled

### 1. Partial Name Match (85% - 95%)
**Likely causes**: Middle name differences, formatting, accents
**Action**: User can proceed with manual verification
**Admin review**: Quick approval if other validations pass

### 2. Low Name Match (< 85%)
**Likely causes**: Data entry error, nickname used, married name
**Action**: User can proceed with manual verification
**Admin review**: Requires careful verification

### 3. Complete Mismatch (< 50%)
**Likely causes**: Wrong document, OCR error, fraud attempt
**Action**: User can proceed with manual verification
**Admin review**: Detailed investigation required

## Translation Keys Required

Add these to all language files (en, es, pr, fr):

**New Keys**:
- `smart_enroll.name_verification_mismatch_title`
- `smart_enroll.name_verification_mismatch_description`
- `smart_enroll.full_name_match`
- `smart_enroll.first_name_match`
- `smart_enroll.last_name_match`
- `smart_enroll.proceed_with_manual_verification_prompt`
- `smart_enroll.proceed_with_manual_verification`
- `smart_enroll.name_mismatch_manual_review`

See `FRONTEND_IMPLEMENTATION_SUMMARY.md` for complete translations.

## Benefits

✅ **No more stuck users** - Clear path forward even when validation fails
✅ **Transparency** - Users see exactly why names don't match (percentages)
✅ **Better UX** - Clear explanation and actionable button
✅ **Admin notification** - Webhook alerts admin to review case
✅ **Audit trail** - Reason stored in database for later review
✅ **Flexibility** - Works for both timeouts and validation failures

## Testing Checklist

- [ ] Test with names that partially match (80-90%)
- [ ] Verify match percentages are displayed correctly
- [ ] Click "Proceed with Manual Verification" button
- [ ] Verify manual verification banner appears
- [ ] Verify user can continue to next step
- [ ] Check admin receives webhook notification
- [ ] Verify database has correct status and metadata
- [ ] Test with different name mismatch scenarios
- [ ] Verify translations in all languages

## Files Modified

1. `src/app/modules/auth/smart-enroll/smart-documents-review/smart-documents-review.component.ts`
2. `src/app/modules/auth/smart-enroll/smart-documents-review/smart-documents-review.component.html`
3. `FRONTEND_IMPLEMENTATION_SUMMARY.md` (updated with new translations)

---

**Implementation Date**: February 7, 2026
**Status**: ✅ Complete
**Impact**: Eliminates user frustration and stuck states for name mismatch cases
