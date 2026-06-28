export type Confidence = "low" | "medium" | "high";

export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export interface SourceLocation {
  filePath: string;
  span?: SourceSpan;
}

export interface Evidence {
  message: string;
  source?: SourceLocation;
}

export type GraphNodeType =
  | "Project"
  | "Package"
  | "File"
  | "Route"
  | "Layout"
  | "Page"
  | "Component"
  | "Primitive"
  | "Token"
  | "TailwindClassGroup"
  | "Icon"
  | "Asset"
  | "MotionPattern"
  | "TypographyStyle"
  | "Pattern"
  | "RefactorCandidate"
  | "AgentAction"
  | "Patch"
  | "PreviewState";

export type GraphEdgeType =
  | "imports"
  | "exports"
  | "renders"
  | "usesComponent"
  | "usesPrimitive"
  | "usesToken"
  | "usesClassGroup"
  | "ownsRoute"
  | "hasLayout"
  | "hasPage"
  | "duplicates"
  | "canExtractTo"
  | "canReplaceWith"
  | "generatedBy"
  | "changedBy"
  | "validatedBy";

export interface ProjectMetadata {
  rootPath: string;
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | "undetected";
  framework: "next-app-router" | "next-pages-router" | "react" | "auto" | "undetected";
}

export interface FileMetadata {
  extension: string;
  relativePath: string;
}

export interface RouteMetadata {
  routePath: string;
  segments: string[];
  dynamic: boolean;
  catchAll: boolean;
  routeGroup: boolean;
  parallel: boolean;
  intercepted: boolean;
}

export interface ComponentMetadata {
  exportName: string;
  kind: "function" | "arrow" | "memo" | "forwardRef" | "unclassified";
  clientBoundary: boolean;
  hooks: string[];
}

export interface TailwindClassGroupMetadata {
  className: string;
  classes: string[];
  normalized: string;
  occurrenceCount: number;
  conflicting: boolean;
}

export interface RefactorCandidateMetadata {
  summary: string;
  risk: "low" | "medium" | "high";
  rollback: string;
  filesAffected: string[];
}

export interface AgentProviderSettings {
  provider: "openai-responses" | "anthropic-messages" | "custom";
  endpoint: string;
  model: string;
  apiKeyEnvironmentVariable?: string;
}

export interface AgentSettings {
  enabled: boolean;
  requireApproval: boolean;
  providers: AgentProviderSettings[];
}

export interface PatchFileChange {
  filePath: string;
  beforeHash?: string;
  diff: string;
}

export interface PatchProposal {
  id: string;
  title: string;
  rationale: string;
  risk: "low" | "medium" | "high";
  confidence: Confidence;
  changes: PatchFileChange[];
  rollback: string;
  evidence: Evidence[];
}

export interface AgentAction {
  id: string;
  provider?: "openai-responses" | "anthropic-messages" | "custom";
  toolName: string;
  status: "planned" | "requires-approval" | "running" | "succeeded" | "failed" | "rolled-back";
  filesRead: string[];
  filesChanged: string[];
  prompts: string[];
  validationCommands: string[];
  evidence: Evidence[];
}

export interface GraphNodeBase<TType extends GraphNodeType, TMetadata> {
  id: string;
  type: TType;
  displayName: string;
  source?: SourceLocation;
  metadata: TMetadata;
  confidence: Confidence;
  evidence: Evidence[];
}

export type ProjectNode = GraphNodeBase<"Project", ProjectMetadata>;
export type FileNode = GraphNodeBase<"File", FileMetadata>;
export type RouteNode = GraphNodeBase<"Route", RouteMetadata>;
export type LayoutNode = GraphNodeBase<"Layout", RouteMetadata>;
export type PageNode = GraphNodeBase<"Page", RouteMetadata>;
export type ComponentNode = GraphNodeBase<"Component", ComponentMetadata>;
export type TailwindClassGroupNode = GraphNodeBase<"TailwindClassGroup", TailwindClassGroupMetadata>;
export type RefactorCandidateNode = GraphNodeBase<"RefactorCandidate", RefactorCandidateMetadata>;

export type GenericMetadata = Record<string, string | number | boolean | string[]>;

export type GenericNode = GraphNodeBase<
  Exclude<
    GraphNodeType,
    | "Project"
    | "File"
    | "Route"
    | "Layout"
    | "Page"
    | "Component"
    | "TailwindClassGroup"
    | "RefactorCandidate"
  >,
  GenericMetadata
>;

export type GraphNode =
  | ProjectNode
  | FileNode
  | RouteNode
  | LayoutNode
  | PageNode
  | ComponentNode
  | TailwindClassGroupNode
  | RefactorCandidateNode
  | GenericNode;

export interface GraphEdge {
  id: string;
  type: GraphEdgeType;
  from: string;
  to: string;
  confidence: Confidence;
  evidence: Evidence[];
}

export interface AuditMetric {
  id: string;
  label: string;
  score: number;
  summary: string;
  evidence: Evidence[];
}

export interface ExemplariumGraph {
  schemaVersion: 1;
  createdAt: string;
  projectRoot: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  audit: AuditMetric[];
  patches: PatchProposal[];
  agentActions: AgentAction[];
}

export interface ExemplariumConfig {
  projectRoot: string;
  framework: "next-app-router" | "next-pages-router" | "react" | "auto";
  include: string[];
  exclude: string[];
  aliases: Record<string, string>;
  tailwind: {
    enabled: boolean;
    configPath?: string;
    cssEntry?: string;
  };
  preview: {
    port: number;
    host: string;
  };
  agents: {
    enabled: boolean;
    provider?: string;
    requireApproval: boolean;
  };
  refactors: {
    dryRunByDefault: boolean;
    requireTests: boolean;
  };
}
