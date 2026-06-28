# Architecture

## Packages

- `@exemplarium/core`: graph, patch, config, and agent action contracts.
- `@exemplarium/next`: Next.js App Router discovery.
- `@exemplarium/tailwind`: class extraction and duplicate group helpers.
- `@exemplarium/analyzer`: project scanner and graph assembly.
- `@exemplarium/cli`: `exemplarium index`.
- `@exemplarium/ui`: React 19 workbench shell.
- `@exemplarium/agents`: provider-agnostic agent contracts.
- `@exemplarium/preview`: preview/session contracts.
- `@exemplarium/codemods`: patch proposal contracts.
- `@exemplarium/storybook-compat`: Storybook migration boundary.

## Pipeline

1. Resolve project context.
2. Discover Next App Router files.
3. Scan TypeScript and TSX files with `ts-morph`.
4. Detect imports, exports, components, rendered children, and Tailwind classes.
5. Create graph nodes and evidence-backed edges.
6. Emit audit metrics and refactor candidates.

## Storybook Boundary

Core packages do not import Storybook internals. Existing Storybook configs and
stories are read later through `@exemplarium/storybook-compat`.
