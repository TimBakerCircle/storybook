import type {
  AuditMetric,
  Confidence,
  Evidence,
  ExemplariumGraph,
  GraphEdge,
  GraphEdgeType,
  GraphNode,
} from "./types.js";

export function createStableId(parts: readonly string[]): string {
  return parts
    .map((part) => part.trim().replaceAll("\\", "/").replaceAll(/\s+/g, "-"))
    .filter((part) => part.length > 0)
    .join(":");
}

export function createEvidence(message: string, filePath?: string): Evidence {
  return filePath ? { message, source: { filePath } } : { message };
}

export function createEdge(
  type: GraphEdgeType,
  from: string,
  to: string,
  evidence: Evidence[],
  confidence: Confidence = "high"
): GraphEdge {
  return {
    id: createStableId(["edge", type, from, to]),
    type,
    from,
    to,
    confidence,
    evidence,
  };
}

export function createGraph(projectRoot: string, nodes: GraphNode[], edges: GraphEdge[], audit: AuditMetric[]): ExemplariumGraph {
  return {
    schemaVersion: 1,
    createdAt: new Date(0).toISOString(),
    projectRoot,
    nodes,
    edges,
    audit,
    patches: [],
    agentActions: [],
  };
}
