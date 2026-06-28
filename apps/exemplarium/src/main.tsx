import { createRoot } from "react-dom/client";

import { createGraph, createStableId, type GraphNode } from "@exemplarium/core";
import { ExemplariumShell } from "@exemplarium/ui";

import "./styles.css";

const sampleNodes: GraphNode[] = [
  {
    id: createStableId(["project", "sample"]),
    type: "Project",
    displayName: "Sample project",
    metadata: {
      rootPath: "sample",
      packageManager: "npm",
      framework: "next-app-router",
    },
    confidence: "high",
    evidence: [{ message: "Sample graph for the local shell." }],
  },
];

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element.");
}

createRoot(root).render(<ExemplariumShell graph={createGraph("sample", sampleNodes, [], [])} />);
