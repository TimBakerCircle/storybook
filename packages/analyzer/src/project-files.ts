import fs from "node:fs";
import path from "node:path";

const supportedExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ignoredDirectories = new Set([".git", ".next", ".turbo", "coverage", "dist", "node_modules", "out"]);

export function toProjectRelativePath(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function shouldIgnoreDirectory(name: string): boolean {
  return ignoredDirectories.has(name);
}

export function scanProjectSourceFiles(projectRoot: string): string[] {
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!shouldIgnoreDirectory(entry.name)) {
          walk(absolutePath);
        }
        continue;
      }

      if (entry.isFile() && supportedExtensions.has(path.extname(entry.name))) {
        files.push(absolutePath);
      }
    }
  }

  walk(projectRoot);
  return files.sort();
}
