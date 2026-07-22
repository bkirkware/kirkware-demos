---
section: Gateway & Wire Formats
---

## content: One gateway, many wire formats {#gw-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/explanation-understanding-wire-format.html
---

### It's not a lowest-common-denominator gateway

Two independent layers matter here: the **client-facing wire format** (what your app sends) and the **backend wire format** (hardcoded per provider). ai-server translates between them — and, critically, doesn't strip fields it doesn't recognize.

- icon:braces **OpenAI API Plans** — Base URL `{api_base}/openai` — `POST /v1/chat/completions`, `POST /v1/embeddings`, `GET /v1/models`. Config reports `"wireFormat": "OPENAI"`.
- icon:sparkles **Anthropic API Plans** — Experimental as of 10.4.2 — base URL `{api_base}/anthropic`, `POST /v1/messages`. Requires the `experimental-anthropic-wireformat` Active Profile.

## diagram: OpenAI-shaped client {#gw-diagram-1}
---
diagram: gateway-wire-format
visibleNodeIds:
  - client-openai
  - wf-gateway
visibleEdgeIds:
  - e-openai-gw
activeNodeIds:
  - client-openai
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/explanation-understanding-wire-format.html
---

### Step 1 — the default: OpenAI wire format

Any OpenAI SDK, or plain curl, talks to `/openai/v1/chat/completions` — the default wire format for every plan.

## diagram: Gateway → backend model {#gw-diagram-2}
---
diagram: gateway-wire-format
visibleNodeIds:
  - client-openai
  - wf-gateway
  - wf-model
visibleEdgeIds:
  - e-openai-gw
  - e-gw-model
activeNodeIds:
  - wf-model
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/explanation-understanding-wire-format.html
---

### Step 2 — ai-server speaks the backend’s native protocol

Behind the gateway, ai-server calls whichever backend is actually bound to the plan — a vLLM/Ollama Worker VM, or a provider-native call to OpenAI, Bedrock, Azure, Vertex, or Anthropic. The client never needs to know which.

## diagram: Anthropic-shaped client {#gw-diagram-3}
---
diagram: gateway-wire-format
visibleNodeIds:
  - client-openai
  - wf-gateway
  - wf-model
  - client-anthropic
visibleEdgeIds:
  - e-openai-gw
  - e-gw-model
  - e-anthropic-gw
activeNodeIds:
  - client-anthropic
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-create-a-plan-using-the-anthropic-api.html
---

### Step 3 — the same model, a second wire contract

Enable the `experimental-anthropic-wireformat` Active Profile and the exact same plan is now reachable via Anthropic's Messages API too — one backend, multiple client SDKs.

## command: Vendor-specific params {#gw-cmd-vendor}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-sending-non-openAI-parameters.html
---

### Passing provider-specific parameters through

The gateway is a passthrough, not a strict schema validator — unknown fields survive the trip. That means you can use provider-specific knobs, like Gemini's `topK`, while keeping the OpenAI SDK shape.

```bash label=curl
curl "$OPENAI_API_BASE/v1/chat/completions" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $API_KEY" \
-d '{
      "model": "gemini-2.5-flash",
      "messages": [{"role": "user", "content": "Explain to me how AI works"}],
      "topK": 20
    }'
```

```output
{
  "id": "chatcmpl-2b91...",
  "object": "chat.completion",
  "model": "gemini-2.5-flash",
  "choices": [{"index": 0, "message": {"role": "assistant", "content": "At its core, AI works by..."}, "finish_reason": "stop"}]
}
```

```python label="python (openai SDK)"
response = client.chat.completions.create(
    model="gemini-2.5-flash",
    messages=[{"role": "user", "content": "Explain to me how AI works"}],
    extra_body={'topK': 20}
)
```

> [!impact]
> `topK` isn't part of the OpenAI chat-completions schema at all — Gemini invented it. The gateway forwards it untouched, so you get Gemini's actual behavior without giving up the OpenAI SDK's ergonomics.

## command: Anthropic Messages API {#gw-cmd-anthropic}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-create-a-plan-using-the-anthropic-api.html
---

### Calling the same plan via Anthropic’s SDK

First flip on the experimental profile in Ops Manager (Advanced Config → Active Profiles), then call `/anthropic/v1/messages` directly, or through the Anthropic Python SDK pointed at the gateway as its base URL.

```text label="Active Profiles (before → after)"
Before: ga-providers,ga-rules,config-api,manage-ui,audit
After:  ga-providers,ga-rules,config-api,manage-ui,audit,experimental-anthropic-wireformat
```

```bash label=curl
curl -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  "$API_BASE/anthropic/v1/messages" -d '{
     "model": "'"$MODEL_NAME"'",
     "max_tokens": 1024,
     "messages": [{"role": "user", "content": "What is the capital of France?"}]
   }'
```

```output
{
  "id": "msg_01XFDUD...",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet",
  "content": [{"type": "text", "text": "The capital of France is Paris."}],
  "stop_reason": "end_turn"
}
```

```python label="python (anthropic SDK)"
import anthropic
client = anthropic.Anthropic(api_key=API_KEY, base_url=f"{API_BASE}/anthropic")
message = client.messages.create(
    model=MODEL_NAME, max_tokens=1024,
    messages=[{"role": "user", "content": "What is the capital of France?"}],
)
print(message.content[0].text)
```

> [!impact]
> The exact same platform-hosted model now answers through a completely different wire contract. Nothing about the model or the plan changed — only which SDK the app team wanted to use.
