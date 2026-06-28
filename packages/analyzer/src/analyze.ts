import path from "node:path";

import {
  createEdge,
  createEvidence,
  createGraph,
  createStableId,
  type AuditMetric,
  type ComponentNode,
  type Evidence,
  type FileNode,
  type GraphEdge,
  type GraphNode,
  type PageNode,
  type RefactorCandidateNode,
  type RouteNode,
  type TailwindClassGroupNode,
} from "@exemplarium/core";
import { discoverNextAppRoutes } from "@exemplarium/next";
import {
  findRepeatedTailwindClassGroups,
  hasTailwindConflict,
  normalizeTailwindClassGroup,
  splitTailwindClasses,
  type TailwindClassOccurrence,
} from "@exemplarium/tailwind";
import {
  ArrowFunction,
  CallExpression,
  FunctionDeclaration,
  Identifier,
  JsxAttribute,
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
  NoSubstitutionTemplateLiteral,
  Project,
  SourceFile,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration,
  ts,
} from "ts-morph";

import { resolveProjectContext, type ProjectContext } from "./context.js";
import { scanProjectSourceFiles, toProjectRelativePath } from "./project-files.js";

export interface AnalyzeProjectOptions {
  projectRoot: string;
}

interface FileAnalysis {
  sourceFile: SourceFile;
  fileNode: FileNode;
  imports: string[];
  exports: string[];
  components: ComponentNode[];
  renderedComponents: string[];
  tailwindOccurrences: TailwindClassOccurrence[];
}

function createSourceEvidence(message: string, projectRoot: string, filePath: string): Evidence {
  return createEvidence(message, toProjectRelativePath(projectRoot, filePath));
}

function isComponentName(name: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function getLineAndColumn(sourceFile: SourceFile, position: number): { line: number; column: number } {
  const lineAndColumn = sourceFile.getLineAndColumnAtPos(position);

  return {
    line: lineAndColumn.line,
    column: lineAndColumn.column,
  };
}

function getSourceSpan(sourceFile: SourceFile, node: Node) {
  return {
    start: getLineAndColumn(sourceFile, node.getStart()),
    end: getLineAndColumn(sourceFile, node.getEnd()),
  };
}

function hasUseClientBoundary(sourceFile: SourceFile): boolean {
  const firstStatement = sourceFile.getStatements()[0];

  return firstStatement?.getText().replace(/;$/, "") === "\"use client\"";
}

function getHooks(sourceFile: SourceFile): string[] {
  const hooks = new Set<string>();

  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expression = call.getExpression();

    if (Identifier.isIdentifier(expression) && /^use[A-Z0-9]/.test(expression.getText())) {
      hooks.add(expression.getText());
    }
  }

  return [...hooks].sort();
}

function createComponentNode(
  projectRoot: string,
  sourceFile: SourceFile,
  name: string,
  kind: ComponentNode["metadata"]["kind"],
  node: FunctionDeclaration | VariableDeclaration
): ComponentNode {
  const filePath = sourceFile.getFilePath();

  return {
    id: createStableId(["component", toProjectRelativePath(projectRoot, filePath), name]),
    type: "Component",
    displayName: name,
    source: {
      filePath: toProjectRelativePath(projectRoot, filePath),
      span: getSourceSpan(sourceFile, node),
    },
    metadata: {
      exportName: name,
      kind,
      clientBoundary: hasUseClientBoundary(sourceFile),
      hooks: getHooks(sourceFile),
    },
    confidence: "high",
    evidence: [createSourceEvidence(`Detected exported React component ${name}.`, projectRoot, filePath)],
  };
}

function collectFunctionComponents(projectRoot: string, sourceFile: SourceFile): ComponentNode[] {
  return sourceFile
    .getFunctions()
    .filter((declaration) => {
      const name = declaration.getName();
      return Boolean(name && isComponentName(name) && declaration.isExported());
    })
    .map((declaration) => {
      const name = declaration.getName();

      if (!name) {
        throw new Error("Expected exported component function to have a name.");
      }

      return createComponentNode(projectRoot, sourceFile, name, "function", declaration);
    });
}

function isComponentInitializer(initializer: Node | undefined): boolean {
  if (!initializer) {
    return false;
  }

  if (ArrowFunction.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
    return true;
  }

  if (CallExpression.isCallExpression(initializer)) {
    const expressionText = initializer.getExpression().getText();
    return expressionText === "memo" || expressionText === "forwardRef" || expressionText.endsWith(".memo");
  }

  return false;
}

function componentKindFromInitializer(initializer: Node | undefined): ComponentNode["metadata"]["kind"] {
  if (!initializer) {
    return "unclassified";
  }

  if (ArrowFunction.isArrowFunction(initializer)) {
    return "arrow";
  }

  if (CallExpression.isCallExpression(initializer)) {
    const expressionText = initializer.getExpression().getText();

    if (expressionText.includes("forwardRef")) {
      return "forwardRef";
    }

    if (expressionText.includes("memo")) {
      return "memo";
    }
  }

  return "unclassified";
}

function collectVariableComponents(projectRoot: string, sourceFile: SourceFile): ComponentNode[] {
  const components: ComponentNode[] = [];

  for (const declaration of sourceFile.getVariableDeclarations()) {
    const name = declaration.getName();
    const statement = declaration.getVariableStatement();

    if (!isComponentName(name) || !statement?.isExported() || !isComponentInitializer(declaration.getInitializer())) {
      continue;
    }

    components.push(
      createComponentNode(projectRoot, sourceFile, name, componentKindFromInitializer(declaration.getInitializer()), declaration)
    );
  }

  return components;
}

function collectRenderedComponentNames(sourceFile: SourceFile): string[] {
  const names = new Set<string>();
  const jsxElements = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  for (const element of jsxElements) {
    const tagName = element.getTagNameNode().getText();
    const baseName = tagName.split(".")[0] || tagName;

    if (isComponentName(baseName)) {
      names.add(baseName);
    }
  }

  return [...names].sort();
}

function getClassNameFromAttribute(attribute: JsxAttribute): string | undefined {
  if (attribute.getNameNode().getText() !== "className") {
    return undefined;
  }

  const initializer = attribute.getInitializer();

  if (StringLiteral.isStringLiteral(initializer) || NoSubstitutionTemplateLiteral.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer.getLiteralText();
  }

  return undefined;
}

function collectTailwindOccurrences(projectRoot: string, sourceFile: SourceFile): TailwindClassOccurrence[] {
  const occurrences: TailwindClassOccurrence[] = [];
  const jsxElements: Array<JsxOpeningElement | JsxSelfClosingElement> = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  for (const element of jsxElements) {
    for (const attribute of element.getAttributes()) {
      if (!JsxAttribute.isJsxAttribute(attribute)) {
        continue;
      }

      const className = getClassNameFromAttribute(attribute);

      if (!className) {
        continue;
      }

      const position = getLineAndColumn(sourceFile, attribute.getStart());

      occurrences.push({
        className,
        classes: splitTailwindClasses(className),
        normalized: normalizeTailwindClassGroup(className),
        filePath: toProjectRelativePath(projectRoot, sourceFile.getFilePath()),
        line: position.line,
        column: position.column,
        conflicting: hasTailwindConflict(className),
      });
    }
  }

  return occurrences;
}

function createFileNode(projectRoot: string, sourceFile: SourceFile): FileNode {
  const relativePath = toProjectRelativePath(projectRoot, sourceFile.getFilePath());

  return {
    id: createStableId(["file", relativePath]),
    type: "File",
    displayName: relativePath,
    source: { filePath: relativePath },
    metadata: {
      extension: path.extname(relativePath),
      relativePath,
    },
    confidence: "high",
    evidence: [createEvidence("Source file included in project scan.", relativePath)],
  };
}

function analyzeSourceFile(projectRoot: string, sourceFile: SourceFile): FileAnalysis {
  const fileNode = createFileNode(projectRoot, sourceFile);

  return {
    sourceFile,
    fileNode,
    imports: sourceFile.getImportDeclarations().map((declaration) => declaration.getModuleSpecifierValue()).sort(),
    exports: [...sourceFile.getExportedDeclarations().keys()].sort(),
    components: [
      ...collectFunctionComponents(projectRoot, sourceFile),
      ...collectVariableComponents(projectRoot, sourceFile),
    ].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    renderedComponents: collectRenderedComponentNames(sourceFile),
    tailwindOccurrences: collectTailwindOccurrences(projectRoot, sourceFile),
  };
}

function createRouteNodes(context: ProjectContext): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const routeFiles = discoverNextAppRoutes(context.rootPath);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const routeFile of routeFiles) {
    const relativePath = toProjectRelativePath(context.rootPath, routeFile.absolutePath);
    const metadata = {
      routePath: routeFile.routePath,
      segments: routeFile.segments,
      dynamic: routeFile.dynamic,
      catchAll: routeFile.catchAll,
      routeGroup: routeFile.routeGroup,
      parallel: routeFile.parallel,
      intercepted: routeFile.intercepted,
    };
    const baseNode = {
      displayName: `${routeFile.kind}: ${routeFile.routePath}`,
      source: { filePath: relativePath },
      metadata,
      confidence: "high" as const,
      evidence: [createEvidence(`Detected Next.js ${routeFile.kind} file for ${routeFile.routePath}.`, relativePath)],
    };
    const routeNode: RouteNode = {
      id: createStableId(["route", routeFile.routePath]),
      type: "Route",
      ...baseNode,
    };

    nodes.push(routeNode);

    if (routeFile.kind === "page") {
      const pageNode: PageNode = {
        id: createStableId(["page", relativePath]),
        type: "Page",
        ...baseNode,
      };
      nodes.push(pageNode);
      edges.push(createEdge("hasPage", routeNode.id, pageNode.id, pageNode.evidence));
    }
  }

  return { nodes, edges };
}

function createTailwindNodes(projectRoot: string, occurrences: readonly TailwindClassOccurrence[]) {
  const repeatedGroups = findRepeatedTailwindClassGroups(occurrences);
  const nodes: TailwindClassGroupNode[] = repeatedGroups.map((group) => ({
    id: createStableId(["tailwind-class-group", group.normalized]),
    type: "TailwindClassGroup",
    displayName: group.normalized,
    metadata: {
      className: group.className,
      classes: splitTailwindClasses(group.normalized),
      normalized: group.normalized,
      occurrenceCount: group.occurrences.length,
      conflicting: group.conflicting,
    },
    confidence: "high",
    evidence: group.occurrences.map((occurrence) =>
      createEvidence(
        `Repeated Tailwind class group appears ${group.occurrences.length} times.`,
        occurrence.filePath
      )
    ),
  }));
  const refactorNodes: RefactorCandidateNode[] = repeatedGroups.map((group) => ({
    id: createStableId(["refactor", "extract-tailwind-group", group.normalized]),
    type: "RefactorCandidate",
    displayName: `Extract repeated class group: ${group.normalized}`,
    metadata: {
      summary: "Repeated utility group can become a primitive, variant, or shared style helper.",
      risk: group.conflicting ? "medium" : "low",
      rollback: "Restore the original className strings from the generated patch diff.",
      filesAffected: [...new Set(group.occurrences.map((occurrence) => occurrence.filePath))].sort(),
    },
    confidence: group.occurrences.length > 2 ? "high" : "medium",
    evidence: group.occurrences.map((occurrence) =>
      createEvidence("Occurrence supports primitive or variant extraction.", occurrence.filePath)
    ),
  }));

  return { nodes, refactorNodes };
}

function createAudit(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): AuditMetric[] {
  const routeCount = nodes.filter((node) => node.type === "Route").length;
  const componentCount = nodes.filter((node) => node.type === "Component").length;
  const tailwindGroupCount = nodes.filter((node) => node.type === "TailwindClassGroup").length;
  const refactorCount = nodes.filter((node) => node.type === "RefactorCandidate").length;

  return [
    {
      id: "route-structure",
      label: "Route Structure",
      score: routeCount > 0 ? 80 : 20,
      summary: routeCount > 0 ? `${routeCount} routes discovered.` : "No Next.js App Router routes discovered.",
      evidence: [createEvidence(`${routeCount} route nodes and ${edges.length} graph edges generated.`)],
    },
    {
      id: "component-graph",
      label: "Component Graph",
      score: componentCount > 0 ? 75 : 25,
      summary: `${componentCount} exported components discovered.`,
      evidence: [createEvidence("Component detection currently covers exported functions and exported arrow components.")],
    },
    {
      id: "tailwind-consistency",
      label: "Tailwind Consistency",
      score: tailwindGroupCount > 0 ? 65 : 90,
      summary: `${tailwindGroupCount} repeated Tailwind class groups detected.`,
      evidence: [createEvidence("Repeated groups are candidate primitives or variant styles.")],
    },
    {
      id: "primitive-opportunity",
      label: "Primitive Opportunity",
      score: refactorCount > 0 ? 70 : 50,
      summary: `${refactorCount} extraction candidates generated.`,
      evidence: [createEvidence("Candidates are suggestions only; no files are rewritten by indexing.")],
    },
  ];
}

function createTsProject(context: ProjectContext): Project {
  if (context.tsconfigPath) {
    return new Project({
      tsConfigFilePath: context.tsconfigPath,
      skipAddingFilesFromTsConfig: true,
    });
  }

  return new Project({
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ESNext,
    },
  });
}

export function analyzeProject(options: AnalyzeProjectOptions) {
  const context = resolveProjectContext(options.projectRoot);
  const project = createTsProject(context);
  const filePaths = scanProjectSourceFiles(context.rootPath);

  project.addSourceFilesAtPaths(filePaths);

  const fileAnalyses = project
    .getSourceFiles()
    .filter((sourceFile) => filePaths.includes(sourceFile.getFilePath()))
    .map((sourceFile) => analyzeSourceFile(context.rootPath, sourceFile));
  const nodes: GraphNode[] = [
    {
      id: createStableId(["project", context.rootPath]),
      type: "Project",
      displayName: path.basename(context.rootPath) || context.rootPath,
      metadata: {
        rootPath: context.rootPath,
        packageManager: context.packageManager,
        framework: context.framework,
      },
      confidence: "high",
      evidence: [createEvidence("Project root resolved for Exemplarium indexing.", context.rootPath)],
    },
  ];
  const edges: GraphEdge[] = [];

  for (const analysis of fileAnalyses) {
    nodes.push(analysis.fileNode, ...analysis.components);

    for (const imported of analysis.imports) {
      edges.push(
        createEdge(
          "imports",
          analysis.fileNode.id,
          createStableId(["import", imported]),
          [createEvidence(`Imports ${imported}.`, analysis.fileNode.metadata.relativePath)],
          "medium"
        )
      );
    }

    for (const component of analysis.components) {
      edges.push(createEdge("exports", analysis.fileNode.id, component.id, component.evidence));
    }
  }

  const componentByName = new Map<string, ComponentNode>();

  for (const analysis of fileAnalyses) {
    for (const component of analysis.components) {
      componentByName.set(component.displayName, component);
    }
  }

  for (const analysis of fileAnalyses) {
    for (const renderedComponent of analysis.renderedComponents) {
      const renderedNode = componentByName.get(renderedComponent);

      if (renderedNode) {
        edges.push(
          createEdge(
            "renders",
            analysis.fileNode.id,
            renderedNode.id,
            [createEvidence(`Renders ${renderedComponent}.`, analysis.fileNode.metadata.relativePath)],
            "medium"
          )
        );
      }
    }
  }

  const routeGraph = createRouteNodes(context);
  nodes.push(...routeGraph.nodes);
  edges.push(...routeGraph.edges);

  const allTailwindOccurrences = fileAnalyses.flatMap((analysis) => analysis.tailwindOccurrences);
  const tailwindGraph = createTailwindNodes(context.rootPath, allTailwindOccurrences);
  nodes.push(...tailwindGraph.nodes, ...tailwindGraph.refactorNodes);

  for (const analysis of fileAnalyses) {
    for (const occurrence of analysis.tailwindOccurrences) {
      const tailwindNodeId = createStableId(["tailwind-class-group", occurrence.normalized]);

      if (tailwindGraph.nodes.some((node) => node.id === tailwindNodeId)) {
        edges.push(
          createEdge(
            "usesClassGroup",
            analysis.fileNode.id,
            tailwindNodeId,
            [createEvidence("File uses a repeated Tailwind class group.", occurrence.filePath)]
          )
        );
      }
    }
  }

  for (const candidate of tailwindGraph.refactorNodes) {
    const classGroupId = candidate.id.replace("refactor:extract-tailwind-group", "tailwind-class-group");
    edges.push(createEdge("canExtractTo", classGroupId, candidate.id, candidate.evidence, candidate.confidence));
  }

  const audit = createAudit(nodes, edges);

  return createGraph(context.rootPath, nodes, edges, audit);
}
