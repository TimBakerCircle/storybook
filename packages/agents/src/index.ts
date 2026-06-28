import type { AgentAction, AgentProviderSettings, PatchProposal } from "@exemplarium/core";

export interface AgentToolContract {
  name: "readFile" | "inspectAst" | "searchSymbols" | "proposePatch" | "applyPatch" | "runTests" | "renderPreview" | "rollbackPatch";
  requiresApproval: boolean;
}

export interface AgentRunRequest {
  goal: string;
  provider: AgentProviderSettings;
  dryRun: boolean;
  tools: AgentToolContract[];
}

export interface AgentRunResult {
  actions: AgentAction[];
  patches: PatchProposal[];
}

export const defaultAgentTools: AgentToolContract[] = [
  { name: "readFile", requiresApproval: false },
  { name: "inspectAst", requiresApproval: false },
  { name: "searchSymbols", requiresApproval: false },
  { name: "proposePatch", requiresApproval: false },
  { name: "applyPatch", requiresApproval: true },
  { name: "runTests", requiresApproval: false },
  { name: "renderPreview", requiresApproval: false },
  { name: "rollbackPatch", requiresApproval: true },
];
