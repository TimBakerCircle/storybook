import fs from "node:fs";
import path from "node:path";

export interface StorybookMigrationReport {
  configDirectory?: string;
  storyFiles: string[];
  recommendation: string;
}

function walk(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
      files.push(...walk(absolutePath));
      continue;
    }

    if (entry.isFile() && /\.(stories|story)\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

export function inspectStorybookMigration(projectRoot: string): StorybookMigrationReport {
  const configDirectory = fs.existsSync(path.join(projectRoot, ".storybook"))
    ? path.join(projectRoot, ".storybook")
    : undefined;

  return {
    ...(configDirectory ? { configDirectory } : {}),
    storyFiles: walk(projectRoot),
    recommendation: "Import stories as Florilegium patterns; keep Storybook CSF export as an adapter concern.",
  };
}
