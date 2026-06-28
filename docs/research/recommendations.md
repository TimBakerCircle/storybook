# Recommendations

## Build Versus Borrow

| Area | Decision |
| --- | --- |
| Project graph | Build in `@exemplarium/core` |
| Next route discovery | Build small native scanner |
| TS/TSX analysis | Depend on `ts-morph` |
| Tailwind conflict checks | Depend on `tailwind-merge` |
| Storybook migration | Build isolated adapter later |
| Visual editing | Study Onlook and Puck first |
| Fixture preview | Study React Cosmos, Ladle, StoryLite |
| Click-to-source | Study React Dev Inspector |
| Agents | Start with contracts, add OpenAI Responses integration later |

## Dependency Risks

- Puck, React Cosmos, and Ladle are useful references but not MVP runtime
  dependencies.
- Plasmic is too large and has license boundaries that require care.
- GrapesJS is not React source-of-truth native.
- Storybook packages are intentionally excluded from the core dependency graph.

## Agent Roles

- Run Orchestrator
- Research Agent
- Planner Agent
- Implementer Agent
- Reviewer Agent
- Skill Curator
- Provider Adapter Agent
