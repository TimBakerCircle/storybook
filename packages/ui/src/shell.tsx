import { useMemo, useState, type ChangeEvent } from "react";

import type { AgentProviderSettings, ExemplariumGraph, GraphNode } from "@exemplarium/core";

interface SectionDefinition {
  id:
    | "elementarium"
    | "typotheca"
    | "iconotheca"
    | "kinetica"
    | "compositorium"
    | "proscenium"
    | "florilegium"
    | "apparatus"
    | "speculum"
    | "settings";
  title: string;
  subtitle: string;
}

const sections: SectionDefinition[] = [
  { id: "proscenium", title: "Proscenium", subtitle: "Pages & Routes" },
  { id: "compositorium", title: "Compositorium", subtitle: "Components" },
  { id: "elementarium", title: "Elementarium", subtitle: "Primitives & Tokens" },
  { id: "typotheca", title: "Typotheca", subtitle: "Typography" },
  { id: "iconotheca", title: "Iconotheca", subtitle: "Icons & Graphics" },
  { id: "kinetica", title: "Kinetica", subtitle: "Motion" },
  { id: "florilegium", title: "Florilegium", subtitle: "Patterns" },
  { id: "apparatus", title: "Apparatus", subtitle: "Tools & Analysis" },
  { id: "speculum", title: "Speculum", subtitle: "Audit" },
  { id: "settings", title: "Settings", subtitle: "Agents & Providers" },
];

export interface ExemplariumShellProps {
  graph: ExemplariumGraph;
}

interface AgentFormState {
  openaiEndpoint: string;
  openaiModel: string;
  openaiApiKey: string;
  anthropicEndpoint: string;
  anthropicModel: string;
  anthropicApiKey: string;
}

function nodesByType(graph: ExemplariumGraph, type: GraphNode["type"]): GraphNode[] {
  return graph.nodes.filter((node) => node.type === type);
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function NodeList({ nodes }: { nodes: GraphNode[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
      {nodes.map((node) => (
        <div className="grid gap-1 p-3" key={node.id}>
          <div className="font-medium text-slate-950">{node.displayName}</div>
          {node.source ? <div className="text-xs text-slate-500">{node.source.filePath}</div> : null}
        </div>
      ))}
      {nodes.length === 0 ? <div className="p-3 text-sm text-slate-500">No entries indexed yet.</div> : null}
    </div>
  );
}

function SpeculumPanel({ graph }: { graph: ExemplariumGraph }) {
  return (
    <div className="grid gap-3">
      {graph.audit.map((metric) => (
        <div className="rounded border border-slate-200 bg-white p-4" key={metric.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-950">{metric.label}</div>
              <div className="text-sm text-slate-600">{metric.summary}</div>
            </div>
            <div className="text-2xl font-semibold text-slate-950">{metric.score}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel() {
  const [form, setForm] = useState<AgentFormState>({
    openaiEndpoint: "https://api.openai.com/v1/responses",
    openaiModel: "gpt-5.4",
    openaiApiKey: "",
    anthropicEndpoint: "https://api.anthropic.com/v1/messages",
    anthropicModel: "claude-sonnet-4-5",
    anthropicApiKey: "",
  });
  const providers: AgentProviderSettings[] = useMemo(
    () => [
      {
        provider: "openai-responses",
        endpoint: form.openaiEndpoint,
        model: form.openaiModel,
      },
      {
        provider: "anthropic-messages",
        endpoint: form.anthropicEndpoint,
        model: form.anthropicModel,
      },
    ],
    [form.anthropicEndpoint, form.anthropicModel, form.openaiEndpoint, form.openaiModel]
  );

  function updateField(field: keyof AgentFormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded border border-slate-200 bg-white p-4">
        <div className="font-semibold text-slate-950">OpenAI Responses</div>
        <input className="rounded border border-slate-300 px-3 py-2" onChange={updateField("openaiEndpoint")} value={form.openaiEndpoint} />
        <input className="rounded border border-slate-300 px-3 py-2" onChange={updateField("openaiModel")} value={form.openaiModel} />
        <input className="rounded border border-slate-300 px-3 py-2" onChange={updateField("openaiApiKey")} placeholder="API key" type="password" value={form.openaiApiKey} />
      </div>
      <div className="grid gap-3 rounded border border-slate-200 bg-white p-4">
        <div className="font-semibold text-slate-950">Anthropic Messages</div>
        <input className="rounded border border-slate-300 px-3 py-2" onChange={updateField("anthropicEndpoint")} value={form.anthropicEndpoint} />
        <input className="rounded border border-slate-300 px-3 py-2" onChange={updateField("anthropicModel")} value={form.anthropicModel} />
        <input className="rounded border border-slate-300 px-3 py-2" onChange={updateField("anthropicApiKey")} placeholder="API key" type="password" value={form.anthropicApiKey} />
      </div>
      <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(providers, null, 2)}</pre>
    </div>
  );
}

function Panel({ activeSection, graph }: { activeSection: SectionDefinition["id"]; graph: ExemplariumGraph }) {
  if (activeSection === "settings") {
    return <SettingsPanel />;
  }

  if (activeSection === "speculum") {
    return <SpeculumPanel graph={graph} />;
  }

  if (activeSection === "proscenium") {
    return <NodeList nodes={nodesByType(graph, "Route")} />;
  }

  if (activeSection === "compositorium") {
    return <NodeList nodes={nodesByType(graph, "Component")} />;
  }

  if (activeSection === "elementarium" || activeSection === "apparatus") {
    return <NodeList nodes={nodesByType(graph, activeSection === "elementarium" ? "TailwindClassGroup" : "RefactorCandidate")} />;
  }

  return <NodeList nodes={[]} />;
}

export function ExemplariumShell({ graph }: ExemplariumShellProps) {
  const [activeSection, setActiveSection] = useState<SectionDefinition["id"]>("speculum");
  const active = sections.find((section) => section.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <nav className="w-72 border-r border-slate-200 bg-white p-3">
          <div className="px-2 py-3">
            <div className="text-xl font-semibold">Exemplarium</div>
            <div className="text-sm text-slate-500">Design-system intelligence</div>
          </div>
          <div className="grid gap-1">
            {sections.map((section) => (
              <button
                className={`rounded px-3 py-2 text-left ${activeSection === section.id ? "bg-slate-950 text-white" : "hover:bg-slate-100"}`}
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                <div className="font-medium">{section.title}</div>
                <div className={`text-xs ${activeSection === section.id ? "text-slate-300" : "text-slate-500"}`}>{section.subtitle}</div>
              </button>
            ))}
          </div>
        </nav>
        <main className="flex-1 p-6">
          <div className="grid gap-6">
            <header>
              <h1 className="text-2xl font-semibold">{active?.title}</h1>
              <p className="text-slate-600">{active?.subtitle}</p>
            </header>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Nodes" value={graph.nodes.length} />
              <MetricCard label="Edges" value={graph.edges.length} />
              <MetricCard label="Components" value={nodesByType(graph, "Component").length} />
              <MetricCard label="Routes" value={nodesByType(graph, "Route").length} />
            </div>
            <Panel activeSection={activeSection} graph={graph} />
          </div>
        </main>
      </div>
    </div>
  );
}
