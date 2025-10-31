#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configuration
const TRANSLATIONS_DIR = path.join(__dirname, "../src/assets/i18n");
const MISSING_TRANSLATIONS_FILE = path.join(__dirname, "missing-translations.json");

// ANSI color codes for better output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function loadJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content);
    } catch (error) {
        console.error(colorize(`Error loading ${filePath}: ${error.message}`, "red"));
        return null;
    }
}

function saveJsonFile(filePath, data) {
    try {
        const content = JSON.stringify(data, null, 4);
        fs.writeFileSync(filePath, content, "utf8");
        return true;
    } catch (error) {
        console.error(colorize(`Error saving ${filePath}: ${error.message}`, "red"));
        return false;
    }
}

function setValueByPath(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}

function validateTranslations(missingTranslationsData) {
    const issues = [];

    if (!missingTranslationsData.missingTranslations) {
        issues.push("Missing 'missingTranslations' section");
        return issues;
    }

    for (const [lang, translations] of Object.entries(missingTranslationsData.missingTranslations)) {
        for (const [key, value] of Object.entries(translations)) {
            // Check if value still looks like English (contains common English words)
            const englishIndicators = ["Search", "Upload", "Document", "successful", "processed", "comparison", "failed", "Gender"];
            const looksLikeEnglish = englishIndicators.some((indicator) => typeof value === "string" && value.includes(indicator));

            if (looksLikeEnglish && lang !== "en") {
                issues.push(`${lang}.${key}: "${value}" appears to be untranslated (still in English)`);
            }

            // Check for placeholder values
            if (typeof value === "string" && (value.includes("[TO TRANSLATE]") || value.includes("TODO"))) {
                issues.push(`${lang}.${key}: Contains placeholder text "${value}"`);
            }
        }
    }

    return issues;
}

function main() {
    console.log(colorize("🚀 Applying Translation Updates", "cyan"));
    console.log(colorize("=================================\n", "cyan"));

    // Check if missing translations file exists
    if (!fs.existsSync(MISSING_TRANSLATIONS_FILE)) {
        console.log(colorize("❌ No missing-translations.json file found.", "red"));
        console.log(colorize("   Run 'npm run check-translations' first to generate missing translations.", "yellow"));
        process.exit(1);
    }

    // Load missing translations data
    const missingTranslationsData = loadJsonFile(MISSING_TRANSLATIONS_FILE);
    if (!missingTranslationsData) {
        console.log(colorize("❌ Failed to load missing-translations.json", "red"));
        process.exit(1);
    }

    // Check if there are any translations to apply
    if (!missingTranslationsData.missingTranslations || Object.keys(missingTranslationsData.missingTranslations).length === 0) {
        console.log(colorize("✅ No missing translations to apply.", "green"));
        process.exit(0);
    }

    console.log(colorize(`📊 Found translations for ${Object.keys(missingTranslationsData.missingTranslations).length} languages`, "blue"));

    // Validate translations
    const validationIssues = validateTranslations(missingTranslationsData);
    if (validationIssues.length > 0) {
        console.log(colorize("\n⚠️  VALIDATION WARNINGS:", "yellow"));
        validationIssues.forEach((issue) => {
            console.log(colorize(`   ${issue}`, "yellow"));
        });
        console.log(colorize("\nContinuing anyway... Please review these translations.\n", "yellow"));
    }

    let totalKeysApplied = 0;
    let languagesUpdated = 0;

    // Apply translations for each language
    for (const [lang, translations] of Object.entries(missingTranslationsData.missingTranslations)) {
        const langFilePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);

        console.log(colorize(`\n🔧 Processing ${lang}.json...`, "magenta"));

        // Load existing language file
        const langData = loadJsonFile(langFilePath);
        if (!langData) {
            console.log(colorize(`   ❌ Failed to load ${lang}.json`, "red"));
            continue;
        }

        let keysApplied = 0;
        const languageName = missingTranslationsData.metadata?.languageNames?.[lang] || lang.toUpperCase();

        // Apply each translation
        for (const [key, value] of Object.entries(translations)) {
            setValueByPath(langData, key, value);
            keysApplied++;
        }

        // Save updated language file
        if (saveJsonFile(langFilePath, langData)) {
            console.log(colorize(`   ✅ Applied ${keysApplied} translations to ${languageName}`, "green"));
            totalKeysApplied += keysApplied;
            languagesUpdated++;
        } else {
            console.log(colorize(`   ❌ Failed to save ${lang}.json`, "red"));
        }
    }

    // Clean up missing translations file by resetting it to empty structure
    const emptyMissingTranslations = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalLanguages: 0,
            totalMissingKeys: 0,
            languageNames: missingTranslationsData.metadata?.languageNames || {},
        },
        missingTranslations: {},
    };

    if (saveJsonFile(MISSING_TRANSLATIONS_FILE, emptyMissingTranslations)) {
        console.log(colorize("\n🧹 Cleaned up missing-translations.json", "green"));
    }

    // Summary
    console.log(colorize("\n📋 SUMMARY", "cyan"));
    console.log(colorize("==========", "cyan"));
    console.log(colorize(`Languages updated: ${languagesUpdated}`, "blue"));
    console.log(colorize(`Total keys applied: ${totalKeysApplied}`, "blue"));

    if (totalKeysApplied > 0) {
        console.log(colorize("\n✅ Translation updates applied successfully!", "green"));
        console.log(colorize("💡 Run 'npm run check-translations -- --i-am-an-agent' to verify all translations are now complete.", "cyan"));
    } else {
        console.log(colorize("\n⚠️  No translations were applied.", "yellow"));
    }
}

function checkAgentFlag() {
    const args = process.argv.slice(2);
    const hasAgentFlag = args.includes("--i-am-an-agent");

    if (!hasAgentFlag) {
        console.log(colorize("🚨 AI Agent Required", "red"));
        console.log(colorize("===================\n", "red"));
        console.log(colorize("This script is designed to be run by an AI Agent as part of the translation", "red"));
        console.log(colorize("workflow and should only be used after translations have been prepared.\n", "red"));

        console.log(colorize("To start the translation workflow, provide this prompt to your IDE's AI agent:\n", "red"));
        console.log(colorize("─".repeat(80), "red"));
        console.log(colorize("Hi, can you run `npm run check-translations -- --i-am-an-agent` from the", "bright"));
        console.log(colorize("web-sdk project and follow the instructions output by the script?", "bright"));
        console.log(colorize("─".repeat(80), "red"));

        console.log(colorize("\nThe AI agent will:", "red"));
        console.log(colorize("✓ Analyze translation files for missing keys", "red"));
        console.log(colorize("✓ Generate a missing-translations.json file if needed", "red"));
        console.log(colorize("✓ Guide you through the translation process", "red"));
        console.log(colorize("✓ Apply translations automatically when ready", "red"));

        console.log(colorize("\n💡 The complete workflow:", "red"));
        console.log(colorize("  1. check-translations: Analyzes and prepares translation files", "red"));
        console.log(colorize("  2. Manual step: Add translations to missing-translations.json", "red"));
        console.log(colorize("  3. apply-translations: Applies translations to language files", "red"));
        console.log(colorize("  4. Verification: Ensures all translations are complete", "red"));

        console.log(colorize("\n⚠️  Note:", "red"));
        console.log(colorize("  This apply-translations script should only be run after", "red"));
        console.log(colorize("  check-translations has identified missing keys and you've", "red"));
        console.log(colorize("  added the translations to missing-translations.json", "red"));

        process.exit(0);
    }
}

// Run the script
if (require.main === module) {
    checkAgentFlag();
    main();
}

module.exports = { main };
