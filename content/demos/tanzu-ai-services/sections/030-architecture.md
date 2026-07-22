---
section: Architecture
---

## title: Follow the request {#arch-divider}
---
variant: section
---

### Architecture

One inference request, traced end to end — every component named exactly as it appears in Ops Manager, cf output, and logs.

- Controller
- Worker VMs
- BOSH
- PostgreSQL

## content: Name the components {#arch-overview}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-architecture.html
---

### The pieces on the board

Six terms carry the whole architecture story.

- icon:server **controller** — BOSH job hosting ai-server and genai-broker; the unit you scale for HA.
- icon:workflow **ai-server** — The gateway. Every inference request passes through it, on-platform or off.
- icon:git-branch **genai-broker** — The on-demand CF service broker behind the `ai-models` marketplace offering.
- icon:boxes **Worker VM** — One dedicated VM per model instance: nginx (TLS) in front of Ollama or vLLM.
- icon:cloud **Off-platform models** — OpenAI, Bedrock, Azure OpenAI, Vertex AI, Anthropic, and Hugging Face custom endpoints — proxied through the same gateway.
- icon:layers **Plans & Policies** — A Plan bundles models behind a marketplace offering; Policies attach guardrails to plans.

## diagram: Trace: app → gorouter {#arch-diagram-1}
---
diagram: system-architecture
show: [client, gorouter, e-client-gorouter]
active: [client, gorouter]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### A bound app calls its service

The app calls its bound AI plan like any other service. The request enters through gorouter — nothing AI-specific has happened yet.

## diagram: Trace: → ai-server {#arch-diagram-2}
---
diagram: system-architecture
add: [ai-server, e-gorouter-aiserver]
active: [ai-server]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### gorouter forwards to ai-server on port 9092

ai-server owns model config, plans, policies, audit, and journaling — the single gateway every inference call passes through.

## diagram: Meet genai-broker {#arch-diagram-3}
---
diagram: system-architecture
add: [genai-broker, e-gorouter-broker]
active: [genai-broker]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### The marketplace side, on port 10005

Same controller VM, different job: genai-broker answers `cf create-service` / `bind-service` / `delete-service` as an on-demand CF broker.

## diagram: Trace: broker → BOSH {#arch-diagram-4}
---
diagram: system-architecture
add: [bosh, e-broker-bosh]
active: [bosh]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### BOSH owns the VM lifecycle

Creating a model instance means standing up a real VM — genai-broker asks the BOSH director to do it. That's why provisioning takes minutes, not milliseconds.

## diagram: Trace: into the Worker VM {#arch-diagram-5}
---
diagram: system-architecture
add: [worker-nginx, worker-runtime, e-aiserver-nginx, e-nginx-runtime]
active: [worker-nginx, worker-runtime]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### nginx on 9023, model runtime on 4000

Each model instance gets its own Worker VM — hard resource isolation. ai-server hits nginx for TLS termination, which hands off to the Ollama or vLLM process.

## diagram: Trace: state in PostgreSQL {#arch-diagram-6}
---
diagram: system-architecture
add: [postgres, e-aiserver-postgres]
active: [postgres]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-backing-psql.html
---

### Config, audit, and journal land in Postgres

ai-server persists to a backing PostgreSQL on 5432 — tile-provisioned or an external instance you point it at.

## diagram: Trace: off-platform path {#arch-diagram-7}
---
diagram: system-architecture
add: [external, e-aiserver-external]
active: [external]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-architecture.html
---

### The same gateway proxies to the cloud

On-platform (Worker VM) and off-platform (HTTPS to the provider) share one ai-server gateway. Developers bind a plan — they never need to know which side serves the request.

## content: Compare topologies {#arch-topologies}
---
variant: split
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-deployment-topologies.html
---

### Minimal vs. full

TechDocs draws the line by how much downtime you can tolerate. Scaling either controller process is one Ops Manager change: tile → Resource Config → instance count.

- icon:boxes **Minimal** — Single controller instance, optional non-GPU Ollama model, any Postgres. Dev and sandbox.
- icon:layers **Full** — Multiple controller instances, models spread across GPU types and providers, production Postgres. Downtime near zero.
