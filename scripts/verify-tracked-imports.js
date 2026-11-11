#!/usr/bin/env node
/**
 * Verifies that all committed/staged TypeScript & Angular source files only reference
 * existing AND git-tracked relative or alias (`app/...`, `@fuse/...`) modules,
 * templates, and stylesheets, and that all i18n JSON files parse cleanly.
 *
 * Prevents committing/pushing code that works locally because a newly created file
 * exists on disk, but breaks CI/staging/production builds because the file was left
 * untracked in Git.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");

function runGitLines(cmd) {
	try {
		const out = execSync(cmd, {
			cwd: REPO_ROOT,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		const set = new Set();
		for (const line of out.split("\n")) {
			const trimmed = line.trim();
			if (trimmed) set.add(path.resolve(REPO_ROOT, trimmed));
		}
		return set;
	} catch (_) {
		return null;
	}
}

function getIndexOrHeadContent(absFile, relFile, isStaged, hasUnstagedWorkingDiff) {
	if (!isStaged && !hasUnstagedWorkingDiff) {
		return fs.existsSync(absFile) ? fs.readFileSync(absFile, "utf8") : "";
	}
	try {
		const ref = isStaged ? `:${relFile}` : `HEAD:${relFile}`;
		return execSync(`git show "${ref}"`, {
			cwd: REPO_ROOT,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			maxBuffer: 10 * 1024 * 1024,
		});
	} catch (_) {
		return fs.existsSync(absFile) ? fs.readFileSync(absFile, "utf8") : "";
	}
}

function resolveImportPath(fromFile, spec) {
	const candidateBases = [];
	if (spec.startsWith(".")) {
		candidateBases.push(path.resolve(path.dirname(fromFile), spec));
	} else if (spec.startsWith("app/") || spec.startsWith("@fuse/")) {
		const normalizedSpec = spec.startsWith("@fuse/") ? spec.replace(/^@fuse\//, "@fuse/") : spec;
		// Check both root src/ and v2/src/ (for verifik-admin-panel)
		candidateBases.push(path.resolve(REPO_ROOT, "src", normalizedSpec));
		candidateBases.push(path.resolve(REPO_ROOT, "v2/src", normalizedSpec));
	} else {
		return null;
	}

	for (const candidateBase of candidateBases) {
		const candidates = [
			candidateBase,
			`${candidateBase}.ts`,
			`${candidateBase}.js`,
			`${candidateBase}.json`,
			path.join(candidateBase, "index.ts"),
			path.join(candidateBase, "index.js"),
		];
		for (const c of candidates) {
			if (fs.existsSync(c) && fs.statSync(c).isFile()) {
				return c;
			}
		}
	}
	return { missing: true, spec };
}

function stripComments(source) {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
		.replace(/\/\/.*$/gm, "");
}

function main() {
	const t0 = Date.now();
	const trackedFiles = runGitLines("git ls-files");
	if (!trackedFiles) {
		console.log("ℹ️ Not a git repository; skipping tracked import check.");
		process.exit(0);
	}

	const stagedFiles = runGitLines("git diff --cached --name-only --diff-filter=ACMR") || new Set();
	const unstagedModifiedFiles = runGitLines("git diff --name-only") || new Set();
	const headDiffFiles = runGitLines("git diff HEAD~1..HEAD --name-only --diff-filter=ACMR") || new Set();
	const untrackedFiles = runGitLines("git ls-files --others --exclude-standard") || new Set();

	const allKnownGitFiles = new Set([...trackedFiles, ...stagedFiles]);
	const recentlyTouchedFiles = new Set([...stagedFiles, ...headDiffFiles]);

	const errors = [];
	let checkedTsCount = 0;
	let checkedJsonCount = 0;

	const importRegexes = [
		/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](\.[^"']+|app\/[^"']+|@fuse\/[^"']+)["']/gm,
		/import\s*\(\s*["'](\.[^"']+|app\/[^"']+|@fuse\/[^"']+)["']\s*\)/gm,
		/templateUrl\s*:\s*["'](\.[^"']+)["']/gm,
	];
	const styleUrlsBlockRegex = /styleUrls\s*:\s*\[([\s\S]*?)\]/gm;
	const styleUrlSingleRegex = /styleUrl\s*:\s*["'](\.[^"']+)["']/gm;

	for (const absFile of allKnownGitFiles) {
		if (!fs.existsSync(absFile)) continue;
		const relFile = path.relative(REPO_ROOT, absFile);
		const isStaged = stagedFiles.has(absFile);
		const hasUnstagedDiff = unstagedModifiedFiles.has(absFile);

		// 1. Validate all i18n JSON files in the repository
		if (relFile.includes("i18n/") && relFile.endsWith(".json")) {
			checkedJsonCount++;
			try {
				const jsonContent = getIndexOrHeadContent(absFile, relFile, isStaged, hasUnstagedDiff);
				if (jsonContent.trim()) JSON.parse(jsonContent);
			} catch (err) {
				errors.push(`${relFile}: Invalid JSON (${err.message})`);
			}
			continue;
		}

		if (!relFile.endsWith(".ts") || relFile.endsWith(".spec.ts") || relFile.includes("node_modules")) {
			continue;
		}

		checkedTsCount++;
		const isRecentlyTouched = recentlyTouchedFiles.has(absFile);
		const rawSource = getIndexOrHeadContent(absFile, relFile, isStaged, hasUnstagedDiff);
		const source = stripComments(rawSource);

		const refs = [];
		for (const rx of importRegexes) {
			rx.lastIndex = 0;
			let m;
			while ((m = rx.exec(source)) !== null) {
				const lineNum = source.slice(0, m.index).split("\n").length;
				refs.push({ spec: m[1], lineNum });
			}
		}

		styleUrlSingleRegex.lastIndex = 0;
		let sm;
		while ((sm = styleUrlSingleRegex.exec(source)) !== null) {
			const lineNum = source.slice(0, sm.index).split("\n").length;
			refs.push({ spec: sm[1], lineNum });
		}

		styleUrlsBlockRegex.lastIndex = 0;
		let bm;
		while ((bm = styleUrlsBlockRegex.exec(source)) !== null) {
			const lineNum = source.slice(0, bm.index).split("\n").length;
			const inner = bm[1];
			const strRx = /["'](\.[^"']+)["']/g;
			let im;
			while ((im = strRx.exec(inner)) !== null) {
				refs.push({ spec: im[1], lineNum });
			}
		}

		for (const ref of refs) {
			const resolved = resolveImportPath(absFile, ref.spec);
			if (!resolved) continue;

			if (typeof resolved === "object" && resolved.missing) {
				if (isRecentlyTouched) {
					errors.push(`${relFile}:${ref.lineNum} -> "${ref.spec}" [FILE_NOT_FOUND]`);
				}
			} else if (untrackedFiles.has(resolved) && !allKnownGitFiles.has(resolved)) {
				const relTarget = path.relative(REPO_ROOT, resolved);
				errors.push(
					`${relFile}:${ref.lineNum} -> "${ref.spec}" resolves to UNTRACKED file: ${relTarget} (run 'git add ${relTarget}')`
				);
			}
		}
	}

	if (errors.length > 0) {
		console.error("\n❌ [IMPORT & I18N CHECK FAILED] Found broken or untracked imports/files in staged/committed code:");
		for (const e of errors) {
			console.error(`   • ${e}`);
		}
		console.error("\n👉 Fix: Run 'git add' on any untracked files or fix broken relative paths before committing/pushing.\n");
		process.exit(1);
	}

	console.log(
		`✅ [IMPORT & I18N CHECK PASSED] Verified ${checkedTsCount} TypeScript files and ${checkedJsonCount} i18n JSON files in ${Date.now() - t0}ms.`
	);
	process.exit(0);
}

main();
