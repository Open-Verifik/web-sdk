#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configuration
const TRANSLATIONS_DIR = path.join(__dirname, "../src/assets/i18n");
const MASTER_FILE = "en.json";
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

function getAllKeys(obj, prefix = "") {
    let keys = [];

    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === "object" && !Array.isArray(value)) {
            keys = keys.concat(getAllKeys(value, fullKey));
        } else {
            keys.push(fullKey);
        }
    }

    return keys;
}

function getValueByPath(obj, path) {
    return path.split(".").reduce((current, key) => current && current[key], obj);
}

function deleteValueByPath(obj, path) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => current && current[key], obj);

    if (target && target.hasOwnProperty(lastKey)) {
        delete target[lastKey];

        // Clean up empty parent objects
        if (Object.keys(target).length === 0 && keys.length > 0) {
            deleteValueByPath(obj, keys.join("."));
        }
    }
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

function getLanguageFiles() {
    try {
        const files = fs
            .readdirSync(TRANSLATIONS_DIR)
            .filter((file) => file.endsWith(".json") && file !== MASTER_FILE)
            .map((file) => ({
                name: file,
                path: path.join(TRANSLATIONS_DIR, file),
                lang: file.replace(".json", ""),
            }));

        return files;
    } catch (error) {
        console.error(colorize(`Error reading translations directory: ${error.message}`, "red"));
        return [];
    }
}

function main() {
    console.log(colorize("🔍 Translation File Analysis", "cyan"));
    console.log(colorize("===============================\n", "cyan"));

    // Load master file
    const masterPath = path.join(TRANSLATIONS_DIR, MASTER_FILE);
    const masterData = loadJsonFile(masterPath);

    if (!masterData) {
        console.error(colorize(`❌ Could not load master file: ${MASTER_FILE}`, "red"));
        process.exit(1);
    }

    const masterKeys = getAllKeys(masterData);
    console.log(colorize(`📚 Master file (${MASTER_FILE}) contains ${masterKeys.length} keys`, "blue"));

    // Get all language files
    const languageFiles = getLanguageFiles();

    if (languageFiles.length === 0) {
        console.log(colorize("⚠️  No translation files found", "yellow"));
        return;
    }

    console.log(colorize(`🌐 Found ${languageFiles.length} translation files: ${languageFiles.map((f) => f.lang).join(", ")}\n`, "blue"));

    let globalStats = {
        totalFilesProcessed: 0,
        totalKeysRemoved: 0,
        totalMissingKeys: 0,
        filesModified: [],
    };

    const allMissingKeys = {};

    // Process each language file
    for (const langFile of languageFiles) {
        console.log(colorize(`\n🔍 Analyzing ${langFile.name}...`, "magenta"));

        const langData = loadJsonFile(langFile.path);
        if (!langData) continue;

        const langKeys = getAllKeys(langData);

        // Find excess keys (in language file but not in master)
        const excessKeys = langKeys.filter((key) => !masterKeys.includes(key));

        // Find missing keys (in master but not in language file)
        const missingKeys = masterKeys.filter((key) => !getValueByPath(langData, key));

        console.log(colorize(`  📊 Current keys: ${langKeys.length}`, "blue"));
        console.log(colorize(`  ➕ Missing keys: ${missingKeys.length}`, "yellow"));
        console.log(colorize(`  ➖ Excess keys: ${excessKeys.length}`, "red"));

        // Store missing keys for reporting
        if (missingKeys.length > 0) {
            allMissingKeys[langFile.lang] = missingKeys;
            globalStats.totalMissingKeys += missingKeys.length;
        }

        // Remove excess keys
        if (excessKeys.length > 0) {
            console.log(colorize(`  🗑️  Removing ${excessKeys.length} excess keys...`, "red"));

            const modifiedData = JSON.parse(JSON.stringify(langData)); // Deep copy

            excessKeys.forEach((key) => {
                deleteValueByPath(modifiedData, key);
            });

            if (saveJsonFile(langFile.path, modifiedData)) {
                console.log(colorize(`  ✅ Successfully cleaned ${langFile.name}`, "green"));
                globalStats.filesModified.push(langFile.name);
                globalStats.totalKeysRemoved += excessKeys.length;
            } else {
                console.log(colorize(`  ❌ Failed to save ${langFile.name}`, "red"));
            }
        } else {
            console.log(colorize(`  ✨ No excess keys found in ${langFile.name}`, "green"));
        }

        globalStats.totalFilesProcessed++;
    }

    // Print summary
    console.log(colorize("\n📋 SUMMARY", "cyan"));
    console.log(colorize("==================", "cyan"));
    console.log(colorize(`Files processed: ${globalStats.totalFilesProcessed}`, "blue"));
    console.log(colorize(`Files modified: ${globalStats.filesModified.length}`, "yellow"));
    console.log(colorize(`Total excess keys removed: ${globalStats.totalKeysRemoved}`, "red"));
    console.log(colorize(`Total missing keys found: ${globalStats.totalMissingKeys}`, "yellow"));

    if (globalStats.filesModified.length > 0) {
        console.log(colorize(`\n🛠️  Modified files: ${globalStats.filesModified.join(", ")}`, "green"));
    }

    // Handle missing keys
    if (Object.keys(allMissingKeys).length > 0) {
        console.log(colorize("\n🚨 MISSING KEYS DETECTED", "yellow"));
        console.log(colorize("=========================", "yellow"));

        // Create missing translations file with metadata
        const missingTranslationsData = {
            metadata: {
                totalLanguages: Object.keys(allMissingKeys).length,
                totalMissingKeys: globalStats.totalMissingKeys,
                languageNames: {
                    br: "Portuguese (Brazil)",
                    es: "Spanish",
                    fr: "French",
                    it: "Italian",
                    ru: "Russian",
                    cn: "Chinese (Simplified)",
                    kr: "Korean",
                    in: "Hindi (India)",
                    ph: "Filipino (Philippines)",
                },
            },
            missingTranslations: {},
        };

        // Populate missing translations with English values for reference
        for (const [lang, keys] of Object.entries(allMissingKeys)) {
            missingTranslationsData.missingTranslations[lang] = {};
            keys.forEach((key) => {
                const englishValue = getValueByPath(masterData, key);
                missingTranslationsData.missingTranslations[lang][key] = englishValue;
            });
        }

        // Save missing translations file
        if (saveJsonFile(MISSING_TRANSLATIONS_FILE, missingTranslationsData)) {
            console.log(colorize(`📝 Missing translations saved to: ${path.basename(MISSING_TRANSLATIONS_FILE)}`, "green"));
        }

        // Generate AI-friendly instructions
        console.log(colorize("\n🤖 AI AGENT INSTRUCTIONS:", "cyan"));
        console.log(colorize("═══════════════════════════", "cyan"));
        console.log(colorize("─".repeat(80), "blue"));
        console.log(colorize("INSTRUCTION FOR AI AGENT:", "bright"));
        console.log("");
        console.log("STEP 1: TRANSLATE THE MISSING KEYS");
        console.log(`Open the file: scripts/${path.basename(MISSING_TRANSLATIONS_FILE)}`);
        console.log("");
        console.log("In the 'missingTranslations' section, you will find English text values that need");
        console.log("to be translated for each language. Replace ONLY the values (keep the keys in English).");
        console.log("");
        console.log("For each language code:");

        for (const [lang, keys] of Object.entries(allMissingKeys)) {
            const languageName = missingTranslationsData.metadata.languageNames[lang] || lang.toUpperCase();
            console.log(`  - ${lang}: Translate to ${languageName} (${keys.length} keys)`);
        }

        console.log("");
        console.log("TRANSLATION GUIDELINES:");
        console.log("✓ Keep all keys in English (e.g., 'search', 'smart_enroll.demo_mode.title')");
        console.log("✓ Translate only the string values to the target language");
        console.log("✓ Maintain proper JSON formatting");
        console.log("✓ Use culturally appropriate translations");
        console.log("✓ Keep technical terms consistent with existing translations");
        console.log("");
        console.log("STEP 2: APPLY THE TRANSLATIONS");
        console.log("After completing all translations, run this command:");
        console.log(colorize("npm run apply-translations -- --i-am-an-agent", "green"));
        console.log("");
        console.log("This will automatically update all language files and clean up the");
        console.log("missing-translations.json file for future use.");
        console.log("");
        console.log("DO NOT manually edit the individual language files - use this workflow instead!");
        console.log("");
        console.log(colorize("─".repeat(80), "blue"));

        console.log(colorize("\n📊 SUMMARY OF MISSING TRANSLATIONS:", "yellow"));

        for (const [lang, keys] of Object.entries(allMissingKeys)) {
            const languageName = missingTranslationsData.metadata.languageNames[lang] || lang.toUpperCase();
            console.log(colorize(`  ${lang.toUpperCase()}: ${keys.length} keys missing (${languageName})`, "yellow"));
        }

        console.log(colorize("\n💡 NEXT STEPS:", "cyan"));
        console.log(colorize("1. Edit scripts/missing-translations.json", "cyan"));
        console.log(colorize("2. Translate all English values to their respective languages", "cyan"));
        console.log(colorize("3. Run 'npm run apply-translations'", "cyan"));
    } else {
        console.log(colorize("\n🎉 All translation files are up to date!", "green"));
        console.log("");
        console.log(colorize("\n🤖 AI AGENT INSTRUCTIONS:", "cyan"));
        console.log(colorize("============================", "cyan"));
        console.log(colorize("You can report that your task is complete. Thank you!", "cyan"));
    }

    console.log(colorize("\n✅ Translation analysis complete!", "green"));
}

function checkAgentFlag() {
    const args = process.argv.slice(2);
    const hasAgentFlag = args.includes("--i-am-an-agent");

    if (!hasAgentFlag) {
        console.log(colorize("🚨 AI Agent Required", "red"));
        console.log(colorize("===================\n", "red"));
        console.log(colorize("This script is designed to be run by an AI Agent to ensure proper translation", "red"));
        console.log(colorize("workflow and prevent accidental manual execution that could cause issues.\n", "red"));

        console.log(colorize("To run this script, provide the following prompt to your IDE's AI agent:\n", "red"));
        console.log(colorize("─".repeat(80), "red"));
        console.log(colorize("Hi, can you run `npm run check-translations -- --i-am-an-agent` from the", "bright"));
        console.log(colorize("web-sdk project and follow the instructions output by the script?", "bright"));
        console.log(colorize("─".repeat(80), "red"));

        console.log(colorize("\nThe AI agent will:", "red"));
        console.log(colorize("✓ Analyze translation files for missing or excess keys", "red"));
        console.log(colorize("✓ Clean up any inconsistencies automatically", "red"));
        console.log(colorize("✓ Generate proper translation instructions if needed", "red"));
        console.log(colorize("✓ Provide next steps for completing translations", "red"));

        console.log(colorize("\n💡 This approach ensures:", "red"));
        console.log(colorize("  • Consistent translation workflow", "red"));
        console.log(colorize("  • Proper handling of missing translations", "red"));
        console.log(colorize("  • AI-assisted translation quality", "red"));
        console.log(colorize("  • Reduced chance of human error", "red"));

        process.exit(0);
    }
}

// Run the script
if (require.main === module) {
    checkAgentFlag();
    main();
}

module.exports = { main, getAllKeys, getValueByPath };
