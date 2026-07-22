---
section: Policies
---

## content: Governance at the gateway, not in the agent {#policies-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### Three policy types, one attachment mechanism

Rate limits, quotas, and webhooks are all configured the same way in Tanzu Operations Manager: give the policy a unique **handle**, set its specific fields, save. Handles then get attached to a plan — comma-separated — in that plan's Config tab. None of this touches KirkwareGPT's own code; every agent bound to the plan inherits the same governance.

> [!info] Everything below is instructions, not implementation
> This section is deliberately Ops Manager click-through instructions rather than commands to run — nothing here gets configured live in this demo.

## content: Configure a rate limit {#policies-rate-limit}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### Requests per minute, tokens per minute, or both

In Tanzu Operations Manager:

- icon:gauge **1. Open the Policy tab** — On the AI Services tile in Operations Manager
- icon:route **2. Add under Rate Limits** — Click Add, then enter a unique policy handle — e.g. `1000-tpm`
- icon:activity **3. Set the thresholds** — Requests per Minute and/or Tokens per Minute — at least one is required
- icon:shield-check **4. Save** — The handle now exists, but applies to nothing until attached to a plan

## content: Configure a quota {#policies-quota}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### A budget over a longer window than a rate limit

Same tab, a different subsection — quotas cap cumulative usage over days or weeks rather than per-minute bursts:

- icon:gauge **1. Add under Quotas** — Enter a unique policy handle — e.g. `kirkwaregpt-weekly-budget`
- icon:activity **2. Set request/token thresholds** — The cumulative ceiling for the window
- icon:route **3. Set the duration** — e.g. `7d` for a one-week rolling window
- icon:shield-check **4. Save** — Same handle-then-attach pattern as rate limits

## content: Configure the credit-card filter webhook {#policies-webhook}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### Filtering sensitive data before it reaches the model

A webhook policy points the gateway at an external service that inspects (and can rewrite or block) chat and embedding requests before they reach the model:

- icon:shield **1. Add under Webhooks** — Enter a unique policy handle — e.g. `kirkwaregpt-cc-filter`
- icon:globe **2. Populate the endpoint fields** — `Chat Base URL` and/or `Embedding URL(s)` — the service that receives the request for inspection
- icon:shield-check **3. Save** — Same handle-then-attach pattern as the other two policy types

> [!warning] Technical preview — and a real documentation gap
> Broadcom's own docs state webhook policies "are currently under technical preview and are not recommended for production usage." They also don't currently publish the exact request/response payload contract for the filtering service. The rest of this section does exactly what that gap demands: build a real filter, deploy it, and read the actual wire format back out of the logs — rather than trust an assumption about it.

## content: Apply the policies to a plan {#policies-apply}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### One field, comma-separated handles

Handles do nothing until attached to a plan:

- icon:layers **1. Open Plan Config** — On the AI Services tile, Plan Config tab
- icon:bot **2. Select a plan** — Whichever plan the agent is bound to
- icon:route **3. Enter the handles** — In the Policies field: `1000-tpm,kirkwaregpt-weekly-budget,kirkwaregpt-cc-filter`
- icon:shield-check **4. Save and apply changes** — Every app bound to this plan — not just KirkwareGPT — now inherits all three policies

> [!success] This is the entire integration surface
> KirkwareGPT never sees a line of rate-limit, quota, or filtering logic — it just occasionally gets a throttled or blocked response, exactly like it would from any other quota-governed API. There's a second way to get the same outcome without hand-typing a handle onto a plan you're already using: switch to a plan the platform team has already pre-configured with it. `kirkware-all-models-pci` is exactly that, and it's what the rest of this section actually uses.

## content: Building the filter for real {#policies-presidio-intro}
---
source: https://microsoft.github.io/presidio/
---

### Microsoft Presidio, deployed as its own Cloud Foundry app

`presidio-content-filter` is a small Python/Flask app — the docs' own example handle name, `presidio-content-filter`, is exactly what it implements. [Presidio](https://microsoft.github.io/presidio/) ships pattern-and-checksum recognizers for both entity types this demo needs, so there's no regex to hand-roll: `US_SSN` and `CREDIT_CARD` (Luhn-validated, so it does not flag arbitrary 16-digit numbers).

- icon:server **Deployed independently** — Its own Cloud Foundry app, its own space — nothing about KirkwareGPT or the gateway changes to add it.
- icon:braces **Shape-agnostic on purpose** — It recursively masks every string in whatever JSON body it receives, rather than assuming one specific request schema — because that schema isn't documented.
- icon:cpu **python_buildpack, one real gotcha** — Presidio's `AnalyzerEngine()` auto-downloads a 400MB spaCy model on first use if you don't tell it otherwise — fine on a laptop, not something to discover mid-deploy. The small model is pinned in `requirements.txt` and explicitly selected in code instead.

## command: Deploy the filter {#policies-presidio-build}
---
source: https://microsoft.github.io/presidio/
---

### `apps/presidio-content-filter/` — masks SSNs and credit cards

The core of it: recursively mask every string in the JSON body, regardless of shape.

```python label="app.py (excerpt)"
ENTITIES = ["US_SSN", "CREDIT_CARD"]
OPERATORS = {
    "US_SSN": OperatorConfig("replace", {"new_value": "<SSN>"}),
    "CREDIT_CARD": OperatorConfig("replace", {"new_value": "<CREDIT_CARD>"}),
}

def mask_value(value, findings):
    if isinstance(value, str):
        masked, found = mask_text(value)
        findings.extend(found)
        return masked
    if isinstance(value, dict):
        return {k: mask_value(v, findings) for k, v in value.items()}
    if isinstance(value, list):
        return [mask_value(v, findings) for v in value]
    return value

@app.route("/", defaults={"path": ""}, methods=["GET", "POST"])
@app.route("/<path:path>", methods=["GET", "POST"])
def webhook(path):
    body = request.get_json(silent=True)
    findings = []
    masked_body = mask_value(body, findings)
    logger.info("masked JSON body, findings=%s", findings)
    return jsonify(masked_body), 200
```

```bash label=push.sh live=presidio-push.sh
cf push -f apps/presidio-content-filter/manifest.yml -p apps/presidio-content-filter
```

## command: Verify the filter directly {#policies-presidio-verify}

### Before wiring it into anything, prove it masks correctly on its own

Bypasses the gateway entirely — this only tells you Presidio itself is working, not that the policy is actually calling it.

```bash label=healthz.sh live=presidio-healthz.sh
curl -s https://presidio.apps.tanzu.kirkware.net/healthz
```

```bash label=analyze.sh live=presidio-analyze.sh
curl -s -X POST https://presidio.apps.tanzu.kirkware.net/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"My SSN is 459-52-3861 and my card number is 4532015112830366."}'
```

> [!impact]
> Expect `findings: ["CREDIT_CARD", "US_SSN"]` and both numbers replaced with `<CREDIT_CARD>` / `<SSN>` in `masked`. If a real SSN-shaped number doesn't get flagged, check it's not one of a handful of famous fake SSNs Presidio deliberately excludes — `078-05-1120` (the 1938 Social Security card ad number) is the classic one.

## command: Switch KirkwareGPT to the filtered plan {#policies-pci-model}

### `kirkware-all-models-pci` — same models, plus this filter already wired in

A normal service rebind, not an Ops Manager change — the platform team already attached this policy to this plan's Config.

```bash label=ensure-pci-model-service.sh live=kirkwaregpt-ensure-pci-model.sh
cf service kirkwaregpt-pci-model || cf create-service ai-models kirkware-all-models-pci kirkwaregpt-pci-model --wait
```

```bash label=unbind-old-model.sh live=kirkwaregpt-unbind-model.sh
cf unbind-service kirkwaregpt kirkwaregpt-model
```

```bash label=bind-pci-model.sh live=kirkwaregpt-bind-pci-model.sh
cf bind-service kirkwaregpt kirkwaregpt-pci-model --wait
```

```bash label=restage.sh live=kirkwaregpt-restage.sh
cf restage kirkwaregpt
```

> [!impact]
> Same model choices, same debug panel — the only thing that changed is which plan is providing them, and that plan now runs every request through presidio-content-filter first.

## command: Validate against the real agent {#policies-pci-verify}

### Send it a fake credit card number and watch what the model actually sees

This calls `kirkwaregpt`'s own `/api/chat` — the same endpoint the browser UI uses — with a made-up card number the model is asked to repeat back verbatim.

```bash label=send-fake-card.sh live=kirkwaregpt-send-fake-card.sh
curl -s -N -X POST https://kirkwaregpt-agent.apps.tanzu.kirkware.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{"id":"cc-test","messages":[{"id":"m1","role":"user","parts":[{"type":"text","text":"My credit card number is 4532015112830366, please repeat it back to me exactly."}]}],"trigger":"submit-message"}' \
  | grep -o '"delta":"[^"]*"' | sed -E 's/"delta":"(.*)"/\1/' | tr -d '\n'
```

> [!impact]
> The real number was masked before the model ever saw it — the reply refuses to repeat it back, and sometimes says so directly (one real run got back: "`<CREDIT_CARD>` appears to be a placeholder rather than an actual number"). Confirm the same thing happened server-side with `cf logs presidio-content-filter --recent` — look for `findings=['CREDIT_CARD']` against a `/prompt` request. Worth showing live in a browser too, not just curl: open [kirkwaregpt.apps.tanzu.kirkware.net](https://kirkwaregpt.apps.tanzu.kirkware.net) and type the same fake card number into the chat.

## diagram: Where enforcement happens {#policies-diagram}
---
diagram: kirkwaregpt-policy-flow
visibleNodeIds:
  - client
  - gateway
  - webhook
  - model
visibleEdgeIds:
  - e-client-gateway
  - e-gateway-webhook
  - e-gateway-model
activeNodeIds:
  - gateway
  - webhook
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-configure-policies.html
---

### At the gateway, in front of the model — never inside the agent

Rate limits and quotas throttle at the gateway before a request goes anywhere. presidio-content-filter inspects both the outbound prompt and the model's streamed response — masking SSNs and credit-card numbers in either direction — before either one reaches the client.

## question: What else needs filtering? {#policies-question}

SSNs and credit-card numbers are two patterns. What other sensitive data would you want a webhook like this one to catch before it reaches a model — for KirkwareGPT, or any other agent on kirkware-all-models-pci?

- Internal employee IDs, API keys and tokens accidentally pasted into a chat are the same shape of problem — Presidio can't catch what it has no recognizer for
- A single webhook policy attached to a plan covers every agent bound to it — this isn't a per-agent decision once it's in place
- Technical preview means test thoroughly before leaning on this for anything with compliance stakes — including testing what happens when the filter itself is slow or down
