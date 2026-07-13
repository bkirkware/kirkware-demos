import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const observabilitySteps: DemoStep[] = [
  {
    id: 'obs-intro',
    type: 'content',
    section: 'Observability & Governance',
    title: 'Audit logging',
    heading: 'Everything is logged — redaction is your choice',
    body: 'Five audit levels, configurable per deployment, trading off retained detail against storage and compliance posture. Default retention is 48 hours for database-backed levels.',
    bullets: [
      { title: 'Off', icon: 'shield', description: 'No audit logging at all.' },
      { title: 'Log to file + DB (redacted)', icon: 'file-text', description: 'Request/response bodies redacted before storage.' },
      { title: 'Log to file only (redacted)', icon: 'file-text', description: 'Same redaction, file-only — no database write.' },
      { title: 'Trace to file + DB (full body)', icon: 'activity', description: 'Full, unredacted request/response bodies retained.' },
      { title: 'Trace to file only (full body)', icon: 'activity', description: 'Full bodies, file-only.' },
    ],
    callout: {
      label: 'MCP audit schema',
      tone: 'info',
      body: 'MCP Gateway calls emit their own structured JSON-lines audit events on the `mcp.audit` logger — a start and stop event per call (`mcp.<method>.start` / `.stop`), tagged with `mcp.session.id`, `enduser.id`, `client.address`, and tool/prompt/resource specifics.',
    },
    sourceUrl: `${DOCS}/how-to-guides-configure-audit-logging.html`,
  },
  {
    id: 'obs-cmd-journal',
    type: 'command',
    section: 'Observability & Governance',
    title: 'Journaling & export',
    heading: 'Opt in per-request, then export for fine-tuning',
    description: 'Journaling (Beta) is an opt-in, per-request transaction log written to PostgreSQL. Set `"store": true` on a request, tag it with metadata, then export a filtered slice — in a format ready for fine-tuning or distillation.',
    commands: [
      {
        label: 'opt-in request',
        lang: 'json',
        code: `{
  "model": "gpt-4o-mini",
  "store": true,
  "metadata": {"use": "eval", "env": "prod"},
  "messages": [{"role": "user", "content": "Tell me a joke."}]
}`,
      },
      {
        label: 'retrieve.sh',
        lang: 'bash',
        code: `curl -i -H "Authorization: Bearer $API_KEY" \\
  "https://genai.tanzu.com/azure/journal/gpt-4o?fromDate=1740507828687&toDate=1836801688360&metadata=use:eval,env:prod"`,
        output: `HTTP/1.1 200 OK
Content-Type: application/json

[
  {"id": "txn_9a21...", "model": "gpt-4o", "metadata": {"use": "eval", "env": "prod"}, "createdAt": "2026-06-01T14:02:11Z"},
  {"id": "txn_9a22...", "model": "gpt-4o", "metadata": {"use": "eval", "env": "prod"}, "createdAt": "2026-06-01T14:03:47Z"}
]`,
      },
      {
        label: 'export.sh',
        lang: 'bash',
        code: `curl -H "Authorization: Bearer $API_KEY" \\
  "https://genai.tanzu.com/azure/journal/export/gpt-4o?fromDate=1740507828687&toDate=1836801688360&format=open-ai-fine-tuning" \\
  -O -J`,
        output: `% Total    % Received % Xferd  Average Speed   Time
100  482k  100  482k    0     0  1204k      0 --:--:--

Saved to: gpt-4o-journal-export-2026-06-01.jsonl`,
      },
    ],
    impact: 'Real production traffic becomes a fine-tuning-ready JSONL export with three requests: opt in, filter by metadata, export. This closes the loop from "in production" to "eval / distill / fine-tune" without a separate logging pipeline.',
    sourceUrl: `${DOCS}/how-to-guides-transactions.html`,
  },
]
