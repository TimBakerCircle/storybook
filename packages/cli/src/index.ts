#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { analyzeProject } from "@exemplarium/analyzer";
import { Command } from "commander";

interface IndexCommandOptions {
  project: string;
  out: string;
  pretty: boolean;
}

function writeJsonFile(filePath: string, value: object, pretty: boolean): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`);
}

export function createCli(): Command {
  const program = new Command();

  program
    .name("exemplarium")
    .description("Index, audit, and inspect React and Next.js design systems.")
    .version("0.1.0");

  program
    .command("index")
    .description("Build a project graph from an existing app.")
    .option("-p, --project <path>", "Project root to index.", process.cwd())
    .option("-o, --out <path>", "Output graph JSON path.", ".exemplarium/graph.json")
    .option("--no-pretty", "Write compact JSON.")
    .action((options: IndexCommandOptions) => {
      const projectRoot = path.resolve(options.project);
      const outputPath = path.resolve(projectRoot, options.out);
      const graph = analyzeProject({ projectRoot });

      writeJsonFile(outputPath, graph, options.pretty);
      process.stdout.write(`Indexed ${graph.nodes.length} nodes and ${graph.edges.length} edges into ${outputPath}\n`);
    });

  program.command("init").description("Create exemplarium.config.ts.").action(() => {
    process.stdout.write("init is reserved for the next implementation pass.\n");
  });

  program.command("audit").description("Print audit summary from a generated graph.").action(() => {
    process.stdout.write("audit is reserved for the next implementation pass.\n");
  });

  return program;
}

createCli().parse(process.argv);
