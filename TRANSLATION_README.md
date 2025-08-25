# Translation Management Scripts

This directory contains scripts to help manage translations across all language files in the biometrics-javascript-sdk project.

## Scripts Overview

### 1. `check-missing-translations.js`
**Purpose**: Analyzes translation files to identify missing, extra, or empty translations.

**Usage**:
```bash
# Check specific language files
node scripts/check-missing-translations.js en.json es.json

# Check all language files against English
node scripts/check-missing-translations.js
```

**Output**:
- Summary of missing/extra keys
- Detailed list of missing translations
- Report file saved to `src/assets/i18n/missing-translations-{lang}.txt`

### 2. `add-missing-translations.js`
**Purpose**: Automatically adds missing translations to all language files.

**Usage**:
```bash
node scripts/add-missing-translations.js
```

**Features**:
- Adds missing translation keys to all language files
- Preserves existing translations
- Adds placeholder text `[TO TRANSLATE] {English text}` for missing values
- Works with all language files in the project

### 3. `translate-all-placeholders.js` ⭐ **NEW**
**Purpose**: Automatically translates all placeholder text (`[TO TRANSLATE]`) to proper translations.

**Usage**:
```bash
node scripts/translate-all-placeholders.js
```

**Features**:
- Translates all `[TO TRANSLATE]` placeholders to proper translations
- Supports multiple languages: French (fr), Portuguese (br), Italian (it), Chinese (cn), Hindi (in), Korean (kr), Russian (ru)
- Covers common UI elements, document scanning, and biometric features
- Automatically processes all language files in the project

**Supported Languages & Coverage**:
- **French (fr)**: Complete translations for UI elements, document scanning, and biometric features
- **Portuguese (br)**: Complete translations for UI elements, document scanning, and biometric features  
- **Italian (it)**: Complete translations for UI elements, document scanning, and biometric features
- **Chinese (cn)**: Complete translations for UI elements, document scanning, and biometric features
- **Hindi (in)**: Complete translations for UI elements, document scanning, and biometric features
- **Korean (kr)**: Complete translations for UI elements, document scanning, and biometric features
- **Russian (ru)**: Complete translations for UI elements, document scanning, and biometric features

## Workflow for Complete Translation Management

### Step 1: Check for Missing Translations
```bash
node scripts/check-missing-translations.js
```

### Step 2: Add Missing Translation Keys
```bash
node scripts/add-missing-translations.js
```

### Step 3: Translate All Placeholders
```bash
node scripts/translate-all-placeholders.js
```

### Step 4: Verify Completion
```bash
node scripts/check-missing-translations.js
```

## Translation Coverage

The translation scripts cover the following key areas:

### UI Elements
- Navigation buttons (Back, Upload, etc.)
- Form labels and instructions
- Error messages and notifications
- Status indicators

### Document Scanning
- Document type selection
- Upload instructions
- OCR processing details
- Validation messages

### Biometric Features
- Face detection instructions
- Liveness verification
- Image capture feedback
- Processing status

### Country Names
- Complete list of 195+ countries
- Properly localized names where applicable
- Consistent formatting across all languages

## Adding New Translations

To add translations for new languages or extend existing ones:

1. **Edit the script**: Open `translate-all-placeholders.js`
2. **Add new language**: Create a new language object in the `translations` object
3. **Add translations**: Map English text to translated text
4. **Run the script**: Execute to apply new translations

Example:
```javascript
// Add new language
"new_lang": {
    "Upload again": "New Language Translation",
    "Back": "New Language Translation",
    // ... more translations
}
```

## File Structure

```
scripts/
├── check-missing-translations.js    # Check for missing translations
├── add-missing-translations.js      # Add missing translation keys
└── translate-all-placeholders.js    # Translate placeholder text

src/assets/i18n/
├── en.json                          # English (base language)
├── es.json                          # Spanish
├── fr.json                          # French
├── br.json                          # Portuguese
├── it.json                          # Italian
├── cn.json                          # Chinese
├── in.json                          # Hindi
├── kr.json                          # Korean
├── ph.json                          # Filipino
└── ru.json                          # Russian
```

## Best Practices

1. **Always start with English**: Use `en.json` as the base language
2. **Check before adding**: Use `check-missing-translations.js` to identify gaps
3. **Translate systematically**: Use `translate-all-placeholders.js` for consistent translations
4. **Verify results**: Run verification scripts after making changes
5. **Maintain consistency**: Keep translation keys synchronized across all languages

## Troubleshooting

### Common Issues

**Missing translations still appear**: 
- Run `translate-all-placeholders.js` again
- Check if the English text exists in the translations object

**Translation quality issues**:
- Review and edit specific language files manually
- Update the translations object in the script

**Script errors**:
- Ensure all language files are valid JSON
- Check file permissions and paths

## Contributing

When adding new features or translations:

1. Update the English base file first
2. Run `add-missing-translations.js` to add new keys
3. Run `translate-all-placeholders.js` to translate new content
4. Verify with `check-missing-translations.js`
5. Test the application with different languages

---

**Last Updated**: December 2024  
**Supported Languages**: 10 languages  
**Total Translation Keys**: 642+ keys per language  
**Coverage**: Complete UI, documents, biometrics, and countries
