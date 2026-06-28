# Exemplarium

Exemplarium is a TypeScript-native design-system intelligence workbench for
React, Next.js App Router, Tailwind CSS 4, React 19, and TypeScript 6.

Storybook asks teams to manually write stories. Exemplarium works in reverse:
it indexes an existing app, discovers pages, routes, layouts, components,
primitives, styles, and design patterns, then helps users inspect and improve
the application structure.

## What Works Today

- `exemplarium index` builds a JSON project graph.
- Next.js App Router route discovery.
- Page and component discovery.
- Import/export graph edges.
- Tailwind class extraction.
- Repeated Tailwind class group detection.
- Refactor candidate nodes for repeated utility groups.
- React UI shell with Exemplarium taxonomy tabs.
- Agent settings UI for OpenAI Responses and Anthropic Messages endpoints.

## Later

- Isolated route and component preview runtime.
- Click-to-source visual inspection.
- Storybook CSF import/export through `@exemplarium/storybook-compat`.
- AST-aware primitive extraction and Tailwind cleanup codemods.
- AI patch generation with explicit approval and validation.

## Install

```sh
npm install
```

## Index A Project

```sh
npm run build
npm run exemplarium -- index --project /path/to/app --out .exemplarium/graph.json
```

## Develop The Local App

```sh
npm run dev
```

## Metadata

Author metadata uses:

Tim Baker <239700173+TimBakerCircle@users.noreply.github.com>
https://github.com/TimBakerCircle
