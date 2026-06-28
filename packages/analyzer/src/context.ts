import fs from "node:fs";
import path from "node:path";

import type { ProjectMetadata } from "@exemplarium/core";
import { findAppDirectory } from "@exemplarium/next";

export interface ProjectContext {
  rootPath: string;
  packageManager: ProjectMetadata["packageManager"];
  framework: ProjectMetadata["framework"];
  tsconfigPath?: string;
  packageJsonPath?: string;
  appDirectory?: string;
  storybookConfigDirectory?: string;
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function directoryExists(directoryPath: string): boolean {
  return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

function detectPackageManager(projectRoot: string): ProjectMetadata["packageManager"] {
  if (fileExists(path.join(projectRoot, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (fileExists(path.join(projectRoot, "yarn.lock"))) {
    return "yarn";
  }

  if (fileExists(path.join(projectRoot, "bun.lockb")) || fileExists(path.join(projectRoot, "bun.lock"))) {
    return "bun";
  }

  if (fileExists(path.join(projectRoot, "package-lock.json"))) {
    return "npm";
  }

  return "undetected";
}

function detectFramework(projectRoot: string): ProjectMetadata["framework"] {
  if (findAppDirectory(projectRoot)) {
    return "next-app-router";
  }

  if (directoryExists(path.join(projectRoot, "pages")) || directoryExists(path.join(projectRoot, "src", "pages"))) {
    return "next-pages-router";
  }

  return "undetected";
}

export function resolveProjectContext(projectRoot: string): ProjectContext {
  const rootPath = path.resolve(projectRoot);
  const tsconfigPath = fileExists(path.join(rootPath, "tsconfig.json")) ? path.join(rootPath, "tsconfig.json") : undefined;
  const packageJsonPath = fileExists(path.join(rootPath, "package.json")) ? path.join(rootPath, "package.json") : undefined;
  const appDirectory = findAppDirectory(rootPath);
  const storybookConfigDirectory = directoryExists(path.join(rootPath, ".storybook")) ? path.join(rootPath, ".storybook") : undefined;

  return {
    rootPath,
    packageManager: detectPackageManager(rootPath),
    framework: detectFramework(rootPath),
    ...(tsconfigPath ? { tsconfigPath } : {}),
    ...(packageJsonPath ? { packageJsonPath } : {}),
    ...(appDirectory ? { appDirectory } : {}),
    ...(storybookConfigDirectory ? { storybookConfigDirectory } : {}),
  };
}
