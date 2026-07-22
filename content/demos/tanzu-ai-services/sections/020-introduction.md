---
section: Introduction
---

## title: Welcome {#intro-title}
---
eyebrow: VMware Tanzu Platform · AI Services v10.4.3
---

### Tanzu AI Services

Large language models in your Cloud Foundry apps — self-hosted or proxied to the cloud, behind one gateway your developers already know how to consume.

- Privacy
- Accessibility
- Unlimited Tokens
- CPU or GPU

## content: Why Tanzu AI Services {#intro-why}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/index.html
---

### Four pillars, straight from the product docs

Developers want self-service model access; platform teams want control over cost, data residency, and hardware. The product frames its answer as four pillars.

- icon:shield **Privacy** — Models run inside your own infrastructure, managed by BOSH and Ops Manager — data never has to leave.
- icon:boxes **Accessibility** — Models appear in the CF Marketplace — self-serve, like provisioning a database.
- icon:sparkles **Unlimited Tokens** — No platform-imposed token caps; only your hardware sets the limit.
- icon:cpu **CPU Hardware Support** — CPUs work for proof-of-concept; GPUs when latency matters.

> [!info] Operating model
> This is an Ops Manager tile — BOSH-managed, not a Kubernetes operator. Operators configure it once; developers only ever touch `cf marketplace` / `cf create-service` / `cf bind-service`.

## discussion: Self-hosted vs. SaaS {#intro-discussion}

Where does your org draw the line between self-hosted models and calling a commercial LLM API?

- Data residency and compliance force on-platform hosting for regulated workloads
- SaaS models win on quality and zero infra ops for low-sensitivity work
- The same gateway proxies both — teams can mix per use case
