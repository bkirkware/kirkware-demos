---
section: Governance & Observability
---

## content: Four policy types {#policies-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### Guardrails that attach to plans

Policies are created on the tile's **Policy** tab under a short handle, then attached to plans by listing handles on the plan config. Two GA, two Technical Preview.

- icon:gauge **Rate Limits** — GA — requests and/or tokens per minute; the everyday noisy-neighbor guardrail.
- icon:shield **Quotas** — GA — a request/token budget over a longer window: "this team gets X tokens a week."
- icon:workflow **Webhooks** — Technical Preview — route chat/embedding traffic through an external filter (content filtering, PII redaction) first.
- icon:braces **Custom** — Technical Preview — bespoke policy logic, only with Broadcom Support guidance.

> [!info] Stacking
> One plan can carry several handles at once — a per-minute rate limit and a weekly quota, independently tunable.

## command: Attach policies {#policies-cmd}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### From Policy tab to plan

Ops Manager form fields, not CLI flags — handle first, plan reference second.

```text label="Rate Limit policy"
Handle:            1000-tpm
Tokens per Minute: 1000
```

```text label="Quota policy"
Handle:   dev-token-budget-weekly
Tokens:   1000000
Duration: 7d
```

```text label="Plan Config → Policies field"
1000-tpm,dev-token-budget-weekly
```

```output
Plan "all-models" updated.
Apply Changes to push the new policy attachments live.
```

> [!impact]
> Every request on this plan is now throttled at 1,000 tokens/minute and capped at 1,000,000 tokens/week — zero app-side changes.

## content: Audit logging levels {#obs-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-audit-logging.html
---

### Everything is logged — redaction is your choice

Five levels trade retained detail against storage and compliance posture. Database retention defaults to 48 hours.

| Level | Bodies | Destination |
| --- | --- | --- |
| Off | — | — |
| Log to file only | redacted | file |
| Log to file and database | redacted | file + Postgres |
| Trace to file only | full | file |
| Trace to file and database | full | file + Postgres |

> [!info] MCP audit schema
> MCP Gateway calls emit their own JSON-lines events on the `mcp.audit` logger — `mcp.<method>.start` / `.stop` pairs tagged with `mcp.session.id`, `enduser.id`, and `client.address`.

## command: Journal & export {#obs-cmd-journal}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-transactions.html
---

### Production traffic → fine-tuning data

Journaling (Beta) is opt-in per request: set `"store": true`, tag with metadata, export a filtered slice in fine-tuning-ready format.

```json label="opt-in request"
{
  "model": "gpt-4o-mini",
  "store": true,
  "metadata": {"use": "eval", "env": "prod"},
  "messages": [{"role": "user", "content": "Tell me a joke."}]
}
```

```bash label=retrieve.sh
curl -i -H "Authorization: Bearer $API_KEY" \
  "https://genai.tanzu.com/azure/journal/gpt-4o?fromDate=1740507828687&toDate=1836801688360&metadata=use:eval,env:prod"
```

```output
HTTP/1.1 200 OK
Content-Type: application/json

[
  {"id": "txn_9a21...", "model": "gpt-4o", "metadata": {"use": "eval", "env": "prod"}, "createdAt": "2026-06-01T14:02:11Z"},
  {"id": "txn_9a22...", "model": "gpt-4o", "metadata": {"use": "eval", "env": "prod"}, "createdAt": "2026-06-01T14:03:47Z"}
]
```

```bash label=export.sh
curl -H "Authorization: Bearer $API_KEY" \
  "https://genai.tanzu.com/azure/journal/export/gpt-4o?fromDate=1740507828687&toDate=1836801688360&format=open-ai-fine-tuning" \
  -O -J
```

```output
% Total    % Received % Xferd  Average Speed   Time
100  482k  100  482k    0     0  1204k      0 --:--:--

Saved to: gpt-4o-journal-export-2026-06-01.jsonl
```

> [!impact]
> Three requests close the loop from "in production" to "ready to fine-tune": opt in, filter by metadata, export JSONL.
