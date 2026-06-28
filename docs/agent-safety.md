# Agent Safety

Agents are optional. Basic indexing and inspection do not require AI.

Rules:

1. No hardcoded API keys.
2. Settings must allow explicit endpoints and model slugs.
3. OpenAI Responses is the P0 provider shape.
4. Anthropic Messages is a later adapter shape.
5. Agents may propose patches but may not silently rewrite files.
6. Patch application and rollback require approval.
7. Agent runs must record tools, prompts, files read, files changed, validation,
   and evidence.
8. Source code is not sent to external providers unless configured and approved.
