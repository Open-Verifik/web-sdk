# Translation Management Scripts

This directory contains scripts to help manage translations across multiple languages efficiently and safely.

## New Workflow (Recommended)

### 1. check-translations.js

-   ✅ **Automatic cleanup**: Removes excess keys that don't exist in the master file
-   📊 **Missing key detection**: Identifies keys that need translation
-   📝 **Creates missing-translations.json**: Centralized file for managing missing translations
-   🤖 **AI-friendly instructions**: Clear, copy-paste instructions for AI agents

### 2. apply-translations.js

-   🚀 **Batch updates**: Programmatically updates all language files at once
-   ✨ **Validation**: Warns about potentially untranslated content
-   🧹 **Auto cleanup**: Resets missing-translations.json after applying

## Usage

### When you have missing translations:

```bash
# 1. Check for missing translations
npm run check-translations

# 2. Edit scripts/missing-translations.json
#    - Translate all English values to their respective languages
#    - Keep all keys in English

# 3. Apply the translations
npm run apply-translations

# 4. Verify everything is complete
npm run check-translations
```

### Benefits of New Workflow:

-   ✅ **No line-by-line editing** of individual language files
-   ✅ **Centralized translation management** via JSON file
-   ✅ **Prevents accidental damage** to language files
-   ✅ **Clear AI agent instructions** with no room for interpretation

## How It Works

1. **Loads** the master file (`src/assets/i18n/en.json`)
2. **Analyzes** all other translation files in the directory
3. **Removes** excess keys that don't exist in the master file
4. **Reports** missing keys that need translation
5. **Provides** AI-friendly instructions for completing translations

## AI Agent Integration

The enhanced workflow provides ultra-clear instructions for AI agents. Simply tell an AI agent:

> "Please run `npm run check-translations` and follow the instructions in the output"

The agent will:

1. Run the check-translations script
2. See the step-by-step instructions
3. Edit the missing-translations.json file with proper translations
4. Run apply-translations to update all language files
5. Verify completion with check-translations

**Key advantage**: No manual editing of individual language files, reducing errors and inconsistencies.

## Supported Languages

-   🇧🇷 **br.json** - Portuguese (Brazil)
-   🇨🇳 **cn.json** - Chinese (Simplified)
-   🇪🇸 **es.json** - Spanish
-   🇫🇷 **fr.json** - French
-   🇮🇳 **in.json** - Hindi (India)
-   🇮🇹 **it.json** - Italian
-   🇰🇷 **kr.json** - Korean
-   🇵🇭 **ph.json** - Filipino (Philippines)
-   🇷🇺 **ru.json** - Russian

## Output Sections

1. **Analysis Summary**: Shows files processed and key counts
2. **AI Agent Instructions**: Ready-to-copy instructions for AI agents
3. **Detailed Breakdown**: Language-specific missing key lists
4. **Usage Tip**: How to use with AI agents

## Safety

-   ✅ **Non-destructive**: Only removes excess keys, never touches existing translations
-   ✅ **Backup friendly**: Easy to rollback changes with git
-   ✅ **Validation**: Proper JSON structure maintained
-   ✅ **Deep object handling**: Correctly handles nested JSON structures

## Example Output

```
🔍 Translation File Analysis
===============================

📚 Master file (en.json) contains 700 keys
🌐 Found 9 translation files: br, cn, es, fr, in, it, kr, ph, ru

🔍 Analyzing br.json...
  📊 Current keys: 694
  ➕ Missing keys: 6
  ➖ Excess keys: 0
  ✨ No excess keys found in br.json

📋 SUMMARY
==================
Files processed: 9
Files modified: 0
Total excess keys removed: 0
Total missing keys found: 56

🤖 AI AGENT INSTRUCTIONS:
═══════════════════════════
[Detailed instructions follow...]
```

## Maintenance

Run this script regularly to keep translations in sync:

-   After adding new keys to `en.json`
-   Before releasing new versions
-   When onboarding new languages
-   As part of CI/CD pipeline (optional)
