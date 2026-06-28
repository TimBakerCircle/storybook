import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { analyzeProject } from "../analyze.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(dirname, "fixtures", "next-app");

describe("analyzeProject", () => {
  it("discovers Next App Router routes", () => {
    const graph = analyzeProject({ projectRoot: fixtureRoot });
    const routeNames = graph.nodes
      .filter((node) => node.type === "Route")
      .map((node) => node.displayName)
      .sort();

    expect(routeNames).toContain("page: /");
    expect(routeNames).toContain("page: /about");
    expect(routeNames).toContain("page: /blog/[slug]");
  });

  it("discovers exported components and render edges", () => {
    const graph = analyzeProject({ projectRoot: fixtureRoot });
    const componentNames = graph.nodes
      .filter((node) => node.type === "Component")
      .map((node) => node.displayName);
    const renderEdges = graph.edges.filter((edge) => edge.type === "renders");

    expect(componentNames).toContain("FeatureCard");
    expect(renderEdges.length).toBeGreaterThan(0);
  });

  it("detects repeated Tailwind class groups and refactor candidates", () => {
    const graph = analyzeProject({ projectRoot: fixtureRoot });
    const classGroups = graph.nodes.filter((node) => node.type === "TailwindClassGroup");
    const candidates = graph.nodes.filter((node) => node.type === "RefactorCandidate");

    expect(classGroups.length).toBeGreaterThan(0);
    expect(candidates.length).toBeGreaterThan(0);
  });

  it("creates a deterministic graph envelope", () => {
    const graph = analyzeProject({ projectRoot: fixtureRoot });

    expect(graph.schemaVersion).toBe(1);
    expect(graph.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(graph.audit.map((metric) => metric.id)).toEqual([
      "route-structure",
      "component-graph",
      "tailwind-consistency",
      "primitive-opportunity",
    ]);
  });
});
