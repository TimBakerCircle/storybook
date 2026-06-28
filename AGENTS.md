# Exemplarium Agent Instructions

Exemplarium is a TypeScript-native workbench for indexing, previewing, auditing,
and eventually refactoring React and Next.js applications. It replaces the old
Storybook fork surface in this repository.

## Priorities

1. Keep the dependency graph minimal.
2. Use TypeScript 6.0.3 and modern Node 26.
3. Prefer strict, explicit interfaces over loose objects.
4. Do not use Storybook internals in core packages.
5. Keep Storybook migration isolated to `@exemplarium/storybook-compat`.
6. Do not hardcode API keys or provider-specific secrets.
7. Agent-generated changes must be patch-based and approval-gated.

## Metadata

Use only:

Tim Baker <239700173+TimBakerCircle@users.noreply.github.com>
https://github.com/TimBakerCircle

Do not add other personal, work, contractor, or company email addresses to
package metadata, docs, examples, generated configs, or templates.

## Commands

Run from the repository root:

```sh
npm install
npm run typecheck
npm run build
npm test
```

Use `npm run exemplarium -- index --project <path> --out <file>` to index a
project.
