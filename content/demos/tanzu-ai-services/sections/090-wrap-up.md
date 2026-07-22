---
section: Wrap-up
---

## content: Recap & roadmap {#wrap-recap}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/release-notes.html
---

### Where the platform is headed

A few threads worth calling back to as you close: several capabilities shown today are Experimental or Technical Preview, and the platform's own naming is still catching up with its scope.

- icon:sparkles **Anthropic API Plans** — Experimental as of 10.4.2 — Messages API wire format alongside the default OpenAI format.
- icon:bot **AI Agent buildpack** — Technical Preview — zero-code chat agents, now with SSO and bearer-token MCP auth options.
- icon:key **Off-platform MCP OAuth** — Technical Preview — forward_token and oauth_passthrough auth modes for off-platform MCP servers.
- icon:git-branch **Naming migration** — The marketplace offering was renamed `genai` → `ai-models` in 10.4.0. Prefer the stable `tanzu-ai-models` / `tanzu-mcp-gateway` tags over offering-name lookups going forward.

> [!info] Support boundary, stated plainly
> Broadcom supports deployment and configuration of specific released vLLM/Ollama versions on GPU hardware. Choosing the right model for a use case, hardware compatibility validation, and performance tuning are explicitly the customer's responsibility.

## title: Closing {#wrap-closing}
---
eyebrow: Discussion
---

### Questions?

What would it take to get Tanzu AI Services onto your platform roadmap?
