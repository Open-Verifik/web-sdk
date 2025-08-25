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
 * Set a nested value in an object using dot notation
 * @param {Object} obj - The object to modify
 * @param {string} path - The dot-notation path (e.g., "header.title")
 * @param {*} value - The value to set
 */
function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key] || typeof current[key] !== "object") {
            current[key] = {};
        }
        return current[key];
    }, obj);
    target[lastKey] = value;
}

/**
 * Add missing translations to a target language file
 * @param {Object} baseLanguage - The base language object (e.g., English)
 * @param {Object} targetLanguage - The target language object to update
 * @param {string} targetLanguageName - Name of the target language for logging
 * @returns {Object} Updated target language object
 */
function addMissingTranslations(baseLanguage, targetLanguage, targetLanguageName) {
    const baseKeys = getAllKeys(baseLanguage);
    const targetKeys = getAllKeys(targetLanguage);
    
    // Find missing keys in target language
    const missingKeys = baseKeys.filter(key => !targetKeys.includes(key));
    
    if (missingKeys.length === 0) {
        console.log(`✅ ${targetLanguageName}: All translations are already present`);
        return targetLanguage;
    }
    
    console.log(`🔧 ${targetLanguageName}: Adding ${missingKeys.length} missing translations...`);
    
    // Add missing translations
    missingKeys.forEach(key => {
        const baseValue = getNestedValue(baseLanguage, key);
        
        // For now, we'll use the English text as a placeholder
        // In a real scenario, you might want to use a translation service
        setNestedValue(targetLanguage, key, `[TO TRANSLATE] ${baseValue}`);
    });
    
    console.log(`✅ ${targetLanguageName}: Added ${missingKeys.length} missing translations`);
    return targetLanguage;
}

/**
 * Main function to add missing translations to all language files
 */
function main() {
    const i18nDir = path.join(__dirname, "..", "src", "assets", "i18n");
    const enPath = path.join(i18nDir, "en.json");
    
    if (!fs.existsSync(enPath)) {
        console.error("❌ English language file not found:", enPath);
        process.exit(1);
    }
    
    try {
        // Read the base language (English)
        const baseLanguage = JSON.parse(fs.readFileSync(enPath, "utf8"));
        console.log(`📖 Base language (English): ${getAllKeys(baseLanguage).length} keys`);
        
        // Get all language files except English
        const languageFiles = fs.readdirSync(i18nDir)
            .filter(file => file.endsWith(".json") && file !== "en.json")
            .map(file => path.join(i18nDir, file));
        
        console.log(`\n🔍 Processing ${languageFiles.length} language files...\n`);
        
        // Process each language file
        languageFiles.forEach(langFile => {
            const langName = path.basename(langFile, ".json").toUpperCase();
            
            try {
                // Read the target language file
                const targetLanguage = JSON.parse(fs.readFileSync(langFile, "utf8"));
                
                // Add missing translations
                const updatedLanguage = addMissingTranslations(baseLanguage, targetLanguage, langName);
                
                // Write the updated file
                fs.writeFileSync(langFile, JSON.stringify(updatedLanguage, null, 4), "utf8");
                
                // Verify the update
                const finalKeys = getAllKeys(updatedLanguage);
                const baseKeys = getAllKeys(baseLanguage);
                const missingKeys = baseKeys.filter(key => !finalKeys.includes(key));
                
                if (missingKeys.length === 0) {
                    console.log(`✅ ${langName}: File updated successfully (${finalKeys.length} keys)`);
                } else {
                    console.log(`⚠️  ${langName}: Still missing ${missingKeys.length} keys`);
                }
                
            } catch (error) {
                console.error(`❌ Error processing ${langName}:`, error.message);
            }
        });
        
        console.log("\n🎉 Translation update process completed!");
        console.log("\n📝 Note: Missing translations have been added with '[TO TRANSLATE]' prefix.");
        console.log("   You should now manually translate these entries or use a translation service.");
        
    } catch (error) {
        console.error("❌ Error reading base language file:", error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    addMissingTranslations,
    getAllKeys,
    getNestedValue,
    setNestedValue
};
