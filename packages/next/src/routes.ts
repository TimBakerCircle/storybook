import fs from "node:fs";
import path from "node:path";

export type RouteFileKind =
  | "page"
  | "layout"
  | "loading"
  | "error"
  | "not-found"
  | "template"
  | "route";

export interface NextRouteFile {
  absolutePath: string;
  appRelativePath: string;
  kind: RouteFileKind;
  routePath: string;
  segments: string[];
  dynamic: boolean;
  catchAll: boolean;
  routeGroup: boolean;
  parallel: boolean;
  intercepted: boolean;
}

const routeFileNames = new Map<string, RouteFileKind>([
  ["page", "page"],
  ["layout", "layout"],
  ["loading", "loading"],
  ["error", "error"],
  ["not-found", "not-found"],
  ["template", "template"],
  ["route", "route"],
]);

const routeFileExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);

function isIgnoredDirectory(name: string): boolean {
  return name === "node_modules" || name === ".next" || name === "dist" || name === ".git";
}

function getRouteFileKind(filePath: string): RouteFileKind | undefined {
  const extension = path.extname(filePath);

  if (!routeFileExtensions.has(extension)) {
    return undefined;
  }

  return routeFileNames.get(path.basename(filePath, extension));
}

function walkRouteFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!isIgnoredDirectory(entry.name)) {
        files.push(...walkRouteFiles(absolutePath));
      }
      continue;
    }

    if (entry.isFile() && getRouteFileKind(absolutePath)) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

function stripRouteSyntax(segment: string): string | undefined {
  if (segment.startsWith("(") && segment.endsWith(")")) {
    return undefined;
  }

  if (segment.startsWith("@")) {
    return undefined;
  }

  if (segment.startsWith("(.)") || segment.startsWith("(..)") || segment.startsWith("(...)")) {
    return segment.replace(/^\(\.{1,3}\)/, "");
  }

  return segment;
}

function routePathFromSegments(segments: readonly string[]): string {
  const visibleSegments = segments
    .map(stripRouteSyntax)
    .filter((segment): segment is string => Boolean(segment));

  return visibleSegments.length ? `/${visibleSegments.join("/")}` : "/";
}

function routeMetadataFromSegments(segments: readonly string[]) {
  return {
    dynamic: segments.some((segment) => segment.startsWith("[") && segment.endsWith("]")),
    catchAll: segments.some((segment) => segment.startsWith("[...") || segment.startsWith("[[...")),
    routeGroup: segments.some((segment) => segment.startsWith("(") && segment.endsWith(")")),
    parallel: segments.some((segment) => segment.startsWith("@")),
    intercepted: segments.some((segment) => segment.startsWith("(.")),
  };
}

export function findAppDirectory(projectRoot: string): string | undefined {
  const candidates = [path.join(projectRoot, "app"), path.join(projectRoot, "src", "app")];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory());
}

export function discoverNextAppRoutes(projectRoot: string): NextRouteFile[] {
  const appDirectory = findAppDirectory(projectRoot);

  if (!appDirectory) {
    return [];
  }

  return walkRouteFiles(appDirectory).map((absolutePath) => {
    const kind = getRouteFileKind(absolutePath);

    if (!kind) {
      throw new Error(`Unexpected non-route file discovered: ${absolutePath}`);
    }

    const appRelativePath = path.relative(appDirectory, absolutePath);
    const segments = path.dirname(appRelativePath) === "." ? [] : path.dirname(appRelativePath).split(path.sep);
    const metadata = routeMetadataFromSegments(segments);

    return {
      absolutePath,
      appRelativePath,
      kind,
      routePath: routePathFromSegments(segments),
      segments,
      ...metadata,
    };
  });
}
