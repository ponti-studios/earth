import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const sourceDirectory = fileURLToPath(new URL("../../../", import.meta.url));
const sourceFiles = [];

function collectFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (entry === "generated" && statSync(path).isDirectory()) continue;
    if (statSync(path).isDirectory()) collectFiles(path);
    else if (/\.(css|ts|tsx)$/.test(entry)) sourceFiles.push(path);
  }
}

collectFiles(sourceDirectory);

const checks = [
  { name: "Radix imports", pattern: /@radix-ui\// },
  { name: "legacy semantic utility classes", pattern: /(?:\bbg-canvas\b|\bborder-default\b)/ },
  {
    name: "invalid shadcn semantic classes",
    pattern: /(?:text|bg|border)-foreground-foreground\b/,
  },
];
const failures = [];

for (const file of sourceFiles) {
  const source = readFileSync(file, "utf8");
  for (const check of checks) {
    if (check.name === "legacy semantic utility classes" && file.endsWith(".css")) continue;
    // Native styles address semantic color tokens through bracket notation;
    // these are token lookups, not the deprecated utility classes.
    if (check.name === "legacy semantic utility classes") {
      let tokenSource = source.replace(/\[\s*["'](?:bg-canvas|border-default)["']\s*\]/g, "__semantic_token_access__");
      if (file.endsWith("color-systems.stories.tsx")) {
        tokenSource = tokenSource.replace(/token:\s*"(?:bg-canvas|border-default)"/g, 'token: "__token-name__"');
      }
      if (check.pattern.test(tokenSource)) failures.push(`${check.name}: ${relative(sourceDirectory, file)}`);
      continue;
    }
    if (check.pattern.test(source))
      failures.push(`${check.name}: ${relative(sourceDirectory, file)}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Source contract passed (${sourceFiles.length} source files checked).`);
