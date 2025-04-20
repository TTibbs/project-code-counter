#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";

// Supported languages and file extensions
type Language = "All" | "TypeScript" | "JavaScript" | "Python";
const langToExt: Record<Language, string[] | null> = {
  All: null,
  TypeScript: [".ts", ".tsx"],
  JavaScript: [".js", ".jsx"],
  Python: [".py"],
};

// Parse CLI flags (e.g. --typescript, --javascript, etc.)
function parseFlags(): Language | null {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const key = arg.slice(2).toLowerCase();
      switch (key) {
        case "typescript":
          return "TypeScript";
        case "javascript":
          return "JavaScript";
        case "python":
          return "Python";
        case "all":
          return "All";
        default:
          console.warn(chalk.red(`Unknown flag: ${arg}`));
          process.exit(1);
      }
    }
  }
  return null;
}

// Recursively gather files, ignoring node_modules and hidden folders
function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// Count lines in a single file, ignoring comment lines based on extension
function countLines(file: string, ext: string): number {
  let content = fs.readFileSync(file, "utf8");

  // JavaScript/TypeScript: remove block comments and filter out single-line comments
  if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
    // strip multiline comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, "");
    const lines = content.split("\n");
    return lines.filter((line) => !line.trim().startsWith("//")).length;
  }

  // Python: filter out lines starting with '#'
  if (ext === ".py") {
    const lines = content.split("\n");
    return lines.filter((line) => !line.trim().startsWith("#")).length;
  }

  // Default: count all lines
  return content.split("\n").length;
}

// Perform the line counting based on selected extensions
type MainContext = { flagLang: Language | null };
function performCount(exts: string[] | null): void {
  const startDir = process.cwd();
  const files = getAllFiles(startDir);
  let total = 0;
  let scanned = 0;

  for (const file of files) {
    const ext = path.extname(file);
    if (!exts || exts.includes(ext)) {
      try {
        total += countLines(file, ext);
        scanned++;
      } catch {
        // skip unreadable files
      }
    }
  }

  console.log(chalk.blue("\nResults:"));
  console.log(chalk.green(`• Files scanned: ${scanned}`));
  console.log(chalk.yellow(`• Total lines of code: ${total}\n`));
}

// Interactive prompt flow
async function interactiveFlow(): Promise<void> {
  console.log(chalk.cyan.bold("Welcome to Count-Lines!"));
  console.log(chalk.gray("Let's count your lines of code interactively.\n"));

  const { language } = await inquirer.prompt<{ language: Language }>([
    {
      type: "list",
      name: "language",
      message: "Select a language to count (or All):",
      choices: Object.keys(langToExt) as Language[],
      default: "All",
    },
  ]);

  console.log(chalk.magenta(`\nCounting ${language} files...`));
  performCount(langToExt[language]);
}

// Main entry
(async function main() {
  const flagLang = parseFlags();
  if (flagLang) {
    console.log(chalk.magenta(`\nCounting ${flagLang} files...`));
    performCount(langToExt[flagLang]);
  } else {
    await interactiveFlow();
  }
})().catch((err: unknown) => {
  console.error(chalk.red("Error:"), err);
  process.exit(1);
});
