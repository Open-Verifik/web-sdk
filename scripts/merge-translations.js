#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
	const output = Object.assign({}, target);
	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach((key) => {
			if (isObject(source[key])) {
				if (!(key in target)) {
					Object.assign(output, { [key]: source[key] });
				} else {
					output[key] = deepMerge(target[key], source[key]);
				}
			} else {
				Object.assign(output, { [key]: source[key] });
			}
		});
	}
	return output;
}

function isObject(item) {
	return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Merge translation sections back into master JSON files
 */
function mergeTranslations() {
	const sectionsDir = path.join(__dirname, "../src/assets/i18n/sections");
	const outputDir = path.join(__dirname, "../src/assets/i18n");

	// Group files by language folders
	const languages = {};
	const languageDirs = fs
		.readdirSync(sectionsDir)
		.filter((item) => {
			const itemPath = path.join(sectionsDir, item);
			return fs.statSync(itemPath).isDirectory();
		})
		.sort();

	languageDirs.forEach((lang) => {
		const langDir = path.join(sectionsDir, lang);
		const sectionFiles = fs
			.readdirSync(langDir)
			.filter((file) => file.endsWith(".json"))
			.sort();

		languages[lang] = {};
		sectionFiles.forEach((file) => {
			const sectionName = file.replace(".json", "");
			languages[lang][sectionName] = file;
		});
	});

	console.log("🌍 Languages found:", Object.keys(languages));

	// Process each language
	Object.entries(languages).forEach(([lang, sections]) => {
		console.log(`\n🔤 Processing language: ${lang}`);

		// Start with base translations (if they exist)
		let masterTranslations = {};

		// Try to load existing master file
		const masterFile = path.join(outputDir, `${lang}.json`);
		if (fs.existsSync(masterFile)) {
			try {
				masterTranslations = JSON.parse(fs.readFileSync(masterFile, "utf8"));
				console.log(`   📖 Loaded existing master file: ${lang}.json`);
			} catch (error) {
				console.error(`   ❌ Error loading master file: ${error.message}`);
			}
		}

		// Merge each section
		Object.entries(sections).forEach(([sectionName, fileName]) => {
			console.log(`   📝 Merging section: ${sectionName}`);

			try {
				const sectionPath = path.join(sectionsDir, lang, fileName);
				const sectionContent = JSON.parse(fs.readFileSync(sectionPath, "utf8"));

				// Deep merge section into master translations
				masterTranslations = deepMerge(masterTranslations, sectionContent);

				console.log(`   ✅ Successfully merged ${sectionName}`);
			} catch (error) {
				console.error(`   ❌ Error merging ${sectionName}: ${error.message}`);
			}
		});

		// Write merged file
		const outputFile = path.join(outputDir, `${lang}.json`);
		try {
			fs.writeFileSync(outputFile, JSON.stringify(masterTranslations, null, "\t"));
			console.log(`   💾 Saved merged file: ${lang}.json`);
		} catch (error) {
			console.error(`   ❌ Error saving merged file: ${error.message}`);
		}
	});

	console.log("\n🎉 Translation merge completed!");
}

// CLI interface
const command = process.argv[2];

if (command === "merge") {
	mergeTranslations();
} else {
	console.log(`
🔄 Translation Management Script

Usage:
  node merge-translations.js merge

Command:
  merge    - Merge section files into master JSON files

Example:
  node merge-translations.js merge
    `);
}
