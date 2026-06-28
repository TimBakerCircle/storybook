# Release

Exemplarium packages publish through npm trusted publishing from GitHub Actions.

## Required npm setup

For each public package, add a trusted publisher in npm:

- GitHub organization or user: `TimBakerCircle`
- Repository: `storybook`
- Workflow filename: `publish.yml`
- Environment: leave blank unless npm requires one for the package

Public packages:

- `@exemplarium/core`
- `@exemplarium/next`
- `@exemplarium/tailwind`
- `@exemplarium/agents`
- `@exemplarium/preview`
- `@exemplarium/codemods`
- `@exemplarium/storybook-compat`
- `@exemplarium/analyzer`
- `@exemplarium/cli`
- `@exemplarium/ui`

## Release flow

1. Open the `Publish Exemplarium` workflow in GitHub Actions.
2. Run it with `dry_run` set to `true`.
3. Confirm typecheck, build, test, and package dry-runs pass.
4. Run it again with `dry_run` set to `false`.

The workflow publishes in dependency order and uses `npm publish --provenance`.
