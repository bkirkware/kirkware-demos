---
section: Policies & Governance
---

## content: Four policy types {#policies-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### Governing how plans get used

Policies are configured on the tile's **Policy** tab in Tanzu Operations Manager, each one saved under a short **handle** — then attached to one or more plans by listing those handles on the plan's own config. Two are GA today; two are Technical Preview.

- icon:gauge **Rate Limits** — GA. Throttles a plan by Requests per Minute and/or Tokens per Minute — the day-to-day guardrail against runaway or noisy-neighbor traffic.
- icon:shield **Quotas** — GA. A request/token budget enforced over a longer window (e.g. a week), rather than a per-minute ceiling — good for "this team gets X tokens a week," not just "no bursts."
- icon:workflow **Webhooks** — Technical Preview — not recommended for production. Routes chat/embedding traffic through an external endpoint first, e.g. a content-filtering or PII-redaction service.
- icon:braces **Custom** — Technical Preview — not recommended for production. Advanced, bespoke policy logic; requires explicit instruction from Broadcom Support to use.

> [!info] Attaching a policy to a plan
> Every policy is created once and referenced by handle. On the plan itself, the **Policies** field on the Plan Config tab takes a comma-separated list of those handles — one plan can carry a rate limit and a quota at the same time.

## command: Defining and attaching policies {#policies-cmd}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### From the Policy tab to a plan

These are Ops Manager form fields, not CLI flags — shown here as the handle → field values a platform operator would fill in, followed by how a plan picks them up.

```text label="Rate Limit policy"
Handle:            1000-tpm
Tokens per Minute: 1000
```

```text label="Quota policy"
Handle:   dev-token-budget-weekly
Tokens:   1000000
Duration: 7d
```

```text label="Webhook policy (Technical Preview)"
Handle:          presidio-content-filter
Chat Base URL:   https://presidio.internal.example.com/chat
Embedding URL(s): https://presidio.internal.example.com/embeddings
```

```text label="Plan Config → Policies field"
1000-tpm,dev-token-budget-weekly
```

```output
Plan "all-models" updated.
Apply Changes to push the new policy attachments live.
```

> [!impact]
> Every request against this plan is now throttled at 1,000 tokens/minute *and* capped at 1,000,000 tokens/week — two independently-tunable guardrails stacked on the same plan, with zero code changes on the app side.
