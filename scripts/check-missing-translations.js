#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Recursively get all keys from a nested object
 * @param {Object} obj - The object to extract keys from
 * @param {string} prefix - The prefix for nested keys
 * @returns {Array} Array of all keys (including nested ones)
 */
function getAllKeys(obj, prefix = "") {
    const keys = [];

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
                // Recursively get keys from nested objects
                keys.push(...getAllKeys(obj[key], fullKey));
            } else {
                keys.push(fullKey);
            }
        }
    }

    return keys;
}

/**
 * Check for missing translations between two language files
 * @param {string} baseLanguagePath - Path to the base language file (e.g., en.json)
 * @param {string} targetLanguagePath - Path to the target language file (e.g., es.json)
 * @param {string} baseLanguageName - Name of the base language (e.g., "English")
 * @param {string} targetLanguageName - Name of the target language (e.g., "Spanish")
 */
function checkMissingTranslations(baseLanguagePath, targetLanguagePath, baseLanguageName, targetLanguageName) {
    try {
        // Read and parse the language files
        const baseLanguage = JSON.parse(fs.readFileSync(baseLanguagePath, "utf8"));
        const targetLanguage = JSON.parse(fs.readFileSync(targetLanguagePath, "utf8"));

        // Get all keys from both files
        const baseKeys = getAllKeys(baseLanguage);
        const targetKeys = getAllKeys(targetLanguage);

        // Find missing keys in target language
        const missingKeys = baseKeys.filter((key) => !targetKeys.includes(key));

        // Find extra keys in target language (not in base)
        const extraKeys = targetKeys.filter((key) => !baseKeys.includes(key));

        // Find keys with empty values in target language
        const emptyValueKeys = [];
        for (const key of targetKeys) {
            const value = getNestedValue(targetLanguage, key);
            if (value === "" || value === null || value === undefined) {
                emptyValueKeys.push(key);
            }
        }

        // Print results
        console.log(`\n🔍 Translation Analysis: ${baseLanguageName} → ${targetLanguageName}`);
        console.log("=".repeat(60));

        console.log(`\n📊 Summary:`);
        console.log(`   Base language (${baseLanguageName}): ${baseKeys.length} keys`);
        console.log(`   Target language (${targetLanguageName}): ${targetKeys.length} keys`);
        console.log(`   Missing in ${targetLanguageName}: ${missingKeys.length} keys`);
        console.log(`   Extra in ${targetLanguageName}: ${extraKeys.length} keys`);
        console.log(`   Empty values in ${targetLanguageName}: ${emptyValueKeys.length} keys`);

        if (missingKeys.length > 0) {
            console.log(`\n❌ Missing translations in ${targetLanguageName}:`);
            missingKeys.forEach((key) => {
                const baseValue = getNestedValue(baseLanguage, key);
                console.log(`   ${key}: "${baseValue}"`);
            });
        }

        if (extraKeys.length > 0) {
            console.log(`\n⚠️  Extra keys in ${targetLanguageName} (not in ${baseLanguageName}):`);
            extraKeys.forEach((key) => {
                const targetValue = getNestedValue(targetLanguage, key);
                console.log(`   ${key}: "${targetValue}"`);
            });
        }

        if (emptyValueKeys.length > 0) {
            console.log(`\n⚠️  Empty values in ${targetLanguageName}:`);
            emptyValueKeys.forEach((key) => {
                console.log(`   ${key}`);
            });
        }

        if (missingKeys.length === 0 && extraKeys.length === 0 && emptyValueKeys.length === 0) {
            console.log(`\n✅ Perfect! All translations are present and complete.`);
        }

        // Generate a report file
        const reportPath = path.join(path.dirname(targetLanguagePath), `missing-translations-${path.basename(targetLanguagePath, ".json")}.txt`);
        generateReport(reportPath, baseLanguageName, targetLanguageName, missingKeys, extraKeys, emptyValueKeys, baseLanguage);

        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
        console.error("❌ Error reading language files:", error.message);
        process.exit(1);
    }
}

/**
 * Get a nested value from an object using dot notation
 * @param {Object} obj - The object to search in
 * @param {string} path - The dot-notation path (e.g., "header.title")
 * @returns {*} The value at the path
 */
function getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

/**
 * Generate a detailed report file
 */
function generateReport(reportPath, baseLanguageName, targetLanguageName, missingKeys, extraKeys, emptyValueKeys, baseLanguage) {
    let report = `Translation Analysis Report: ${baseLanguageName} → ${targetLanguageName}\n`;
    report += "=".repeat(60) + "\n\n";

    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += `Summary:\n`;
    report += `- Missing translations: ${missingKeys.length}\n`;
    report += `- Extra keys: ${extraKeys.length}\n`;
    report += `- Empty values: ${emptyValueKeys.length}\n\n`;

    if (missingKeys.length > 0) {
        report += `Missing translations in ${targetLanguageName}:\n`;
        report += "-".repeat(40) + "\n";
        missingKeys.forEach((key) => {
            const baseValue = getNestedValue(baseLanguage, key);
            report += `${key}: "${baseValue}"\n`;
        });
        report += "\n";
    }

    if (extraKeys.length > 0) {
        report += `Extra keys in ${targetLanguageName}:\n`;
        report += "-".repeat(40) + "\n";
        extraKeys.forEach((key) => {
            report += `${key}\n`;
        });
        report += "\n";
    }

    if (emptyValueKeys.length > 0) {
        report += `Empty values in ${targetLanguageName}:\n`;
        report += "-".repeat(40) + "\n";
        emptyValueKeys.forEach((key) => {
            report += `${key}\n`;
        });
    }

    fs.writeFileSync(reportPath, report);
}

/**
 * Main function to run the script
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log("Usage: node check-missing-translations.js <base-language-file> <target-language-file>");
        console.log("Example: node check-missing-translations.js en.json es.json");
        console.log("\nOr run without arguments to check all language files against English:");
        console.log("node check-missing-translations.js");
        process.exit(1);
    }

    if (args.length === 2) {
        // Check specific files
        const baseLanguagePath = args[0];
        const targetLanguagePath = args[1];

        // Determine language names from file paths
        const baseLanguageName = path.basename(baseLanguagePath, ".json").toUpperCase();
        const targetLanguageName = path.basename(targetLanguagePath, ".json").toUpperCase();

        checkMissingTranslations(baseLanguagePath, targetLanguagePath, baseLanguageName, targetLanguageName);
    } else {
        // Check all language files against English
        const i18nDir = path.join(__dirname, "..", "src", "assets", "i18n");
        const enPath = path.join(i18nDir, "en.json");

        if (!fs.existsSync(enPath)) {
            console.error("❌ English language file not found:", enPath);
            process.exit(1);
        }

        const languageFiles = fs
            .readdirSync(i18nDir)
            .filter((file) => file.endsWith(".json") && file !== "en.json")
            .map((file) => path.join(i18nDir, file));

        console.log(`🔍 Checking ${languageFiles.length} language files against English...\n`);

        languageFiles.forEach((langFile) => {
            const langName = path.basename(langFile, ".json").toUpperCase();
            checkMissingTranslations(enPath, langFile, "English", langName);
        });
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    checkMissingTranslations,
    getAllKeys,
    getNestedValue,
};
