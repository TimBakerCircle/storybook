import type { PatchProposal } from "@exemplarium/core";

export interface CodemodPlan {
  id: string;
  title: string;
  patches: PatchProposal[];
  validationCommands: string[];
}

export function createEmptyCodemodPlan(id: string, title: string): CodemodPlan {
  return {
    id,
    title,
    patches: [],
    validationCommands: [],
  };
}
