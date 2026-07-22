---
section: Architecture
---

## content: Component inventory {#arch-overview}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-architecture.html
---

### The pieces on the board

Before tracing a request through the system, it's worth naming every component using the exact terms TechDocs uses — these labels show up in Ops Manager, in `cf` output, and in logs.

- icon:server **controller** — BOSH job hosting both the ai-server and genai-broker processes — the unit you scale for HA.
- icon:workflow **ai-server** — The core gateway/proxy — receives inference requests via gorouter and forwards them to model workers.
- icon:git-branch **genai-broker** — The on-demand Cloud Foundry service broker — handles create/bind/delete-service lifecycle for the ai-models marketplace offering.
- icon:boxes **Worker VM** — A dedicated VM per model instance, running nginx (TLS termination) in front of Ollama or vLLM.
- icon:cloud **On/Off-Platform Models** — On-platform = Ollama/vLLM you host; off-platform = OpenAI, Bedrock, Azure OpenAI, Vertex AI, Anthropic proxied through.
- icon:layers **Plans & Policies** — A Plan bundles one or more models behind a marketplace offering; Policies (rate limits, quotas, webhooks) attach to plans.

## diagram: App → routing tier {#arch-diagram-1}
---
diagram: system-architecture
visibleNodeIds:
  - client
  - gorouter
visibleEdgeIds:
  - e-client-gorouter
activeNodeIds:
  - client
  - gorouter
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### Step 1 — a bound app talks to gorouter

A CF app calls its bound AI Services plan exactly like it would call any other bound service — the request enters through Cloud Foundry's own routing tier, gorouter. Nothing AI-specific happens yet.

## diagram: Routing → ai-server {#arch-diagram-2}
---
diagram: system-architecture
visibleNodeIds:
  - client
  - gorouter
  - ai-server
visibleEdgeIds:
  - e-client-gorouter
  - e-gorouter-aiserver
activeNodeIds:
  - ai-server
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### Step 2 — gorouter forwards to ai-server on port 9092

gorouter forwards the inference request to ai-server, the controller job that owns model configuration, plans, policies, audit, and journaling. This is the single gateway every inference call passes through, on-platform or off.

## diagram: The other controller process {#arch-diagram-3}
---
diagram: system-architecture
visibleNodeIds:
  - client
  - gorouter
  - ai-server
  - genai-broker
visibleEdgeIds:
  - e-client-gorouter
  - e-gorouter-aiserver
  - e-gorouter-broker
activeNodeIds:
  - genai-broker
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### Step 3 — genai-broker: the marketplace side

genai-broker lives on the same controller VM as ai-server but handles a completely different job: it's the on-demand CF service broker that answers `cf create-service` / `cf bind-service` / `cf delete-service` calls, on port 10005.

## diagram: Broker → BOSH {#arch-diagram-4}
---
diagram: system-architecture
visibleNodeIds:
  - client
  - gorouter
  - ai-server
  - genai-broker
  - bosh
visibleEdgeIds:
  - e-client-gorouter
  - e-gorouter-aiserver
  - e-gorouter-broker
  - e-broker-bosh
activeNodeIds:
  - bosh
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### Step 4 — genai-broker provisions Worker VMs via BOSH

When a model instance needs to be created or torn down, genai-broker talks to the BOSH director, which owns the actual VM lifecycle. This is why provisioning a new on-platform model takes minutes, not milliseconds — a real VM is being stood up.

## diagram: Into the Worker VM {#arch-diagram-5}
---
diagram: system-architecture
visibleNodeIds:
  - client
  - gorouter
  - ai-server
  - genai-broker
  - bosh
  - worker-nginx
  - worker-runtime
visibleEdgeIds:
  - e-client-gorouter
  - e-gorouter-aiserver
  - e-gorouter-broker
  - e-broker-bosh
  - e-aiserver-nginx
  - e-nginx-runtime
activeNodeIds:
  - worker-nginx
  - worker-runtime
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-network-communications.html
---

### Step 5 — ai-server forwards to nginx, then the model runtime

Each model instance gets its own dedicated Worker VM — hard resource isolation per model. ai-server forwards to nginx on port 9023 for TLS termination, which hands off to the actual Ollama or vLLM process on port 4000.

## diagram: State: config, audit, journal {#arch-diagram-6}
---
diagram: system-architecture
visibleNodeIds:
  - client
  - gorouter
  - ai-server
  - genai-broker
  - bosh
  - worker-nginx
  - worker-runtime
  - postgres
visibleEdgeIds:
  - e-client-gorouter
  - e-gorouter-aiserver
  - e-gorouter-broker
  - e-broker-bosh
  - e-aiserver-nginx
  - e-nginx-runtime
  - e-aiserver-postgres
activeNodeIds:
  - postgres
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-backing-psql.html
---

### Step 6 — PostgreSQL backs configuration, audit, and journaling

ai-server persists its configuration, audit trail, and (when enabled) request/response journaling to a backing PostgreSQL database — either broker-provisioned or an external instance you point it at.

## diagram: Off-platform proxy path {#arch-diagram-7}
---
diagram: system-architecture
visibleNodeIds:
  - client
  - gorouter
  - ai-server
  - genai-broker
  - bosh
  - worker-nginx
  - worker-runtime
  - postgres
  - external
visibleEdgeIds:
  - e-client-gorouter
  - e-gorouter-aiserver
  - e-gorouter-broker
  - e-broker-bosh
  - e-aiserver-nginx
  - e-nginx-runtime
  - e-aiserver-postgres
  - e-aiserver-external
activeNodeIds:
  - external
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-architecture.html
---

### Step 7 — the same gateway proxies to the cloud

The full picture: on-platform inference (through the Worker VM) and off-platform inference (proxied over HTTPS to OpenAI, Bedrock, Azure OpenAI, Vertex AI, or Anthropic) share the exact same ai-server gateway. Developers bind to a plan — they don't need to know or care which side of this diagram actually serves the request.

## content: Deployment topologies {#arch-topologies}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/reference-deployment-topologies.html
---

### Minimal vs. full topology

TechDocs lays out two reference topologies depending on how much downtime you can tolerate.

- icon:boxes **Minimal topology** — Single ai-server and genai-broker instance, an optional single non-GPU Ollama model, any backing PostgreSQL. Good for dev/sandbox use — some downtime is acceptable.
- icon:layers **Full topology** — Multiple ai-server and genai-broker instances, multiple model instances across providers (e.g. three Llama 3.1 on T4 GPUs plus two Mistral on A100 GPUs), production-ready PostgreSQL. Downtime must be kept to an absolute minimum.

> [!info] Scaling in practice
> Scaling either ai-server or genai-broker is the same operation: Ops Manager → AI Services tile → Resource Config tab → change the instance count on the controller job.
