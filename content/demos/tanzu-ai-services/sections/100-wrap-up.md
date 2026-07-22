---
section: Wrap-up
---

## content: Recap & roadmap {#wrap-recap}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/release-notes.html
---

### Where the platform is headed

Several capabilities shown today ship ahead of GA — know the maturity labels before committing production workloads.

- icon:sparkles **Anthropic API Plans** — Experimental (10.4.2+; 8192-token default responses since 10.4.3).
- icon:bot **Agent Buildpack** — Technical Preview, now with OIDC SSO and bearer-token MCP auth.
- icon:key **Off-platform MCP OAuth** — Technical Preview: forward_token and oauth_passthrough modes.
- icon:git-branch **Naming migration** — `genai` → `ai-models` in 10.4.0; prefer the stable `tanzu-ai-models` / `tanzu-mcp-gateway` tags.

> [!info] Support boundary, stated plainly
> Broadcom supports deploying and configuring released vLLM/Ollama versions on GPU hardware. Model selection, hardware validation, and performance tuning are the customer's responsibility.

## title: Closing {#wrap-closing}
---
eyebrow: Discussion
---

### Questions?

What would it take to get Tanzu AI Services onto your platform roadmap?
