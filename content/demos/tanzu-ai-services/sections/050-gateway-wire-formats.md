---
section: Gateway & Wire Formats
---

## content: Two independent layers {#gw-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/explanation-understanding-wire-format.html
---

### Not a lowest-common-denominator gateway

The **client wire format** (what your app sends) and the **backend wire format** (per provider) are independent — ai-server translates between them without stripping fields it doesn't recognize.

| Wire format | Base URL | Status |
| --- | --- | --- |
| OpenAI | `{api_base}/openai` → `/v1/chat/completions`, `/v1/embeddings`, `/v1/models` | Default, GA |
| Anthropic | `{api_base}/anthropic` → `/v1/messages` | Experimental (10.4.2+) |

## diagram: OpenAI-shaped client {#gw-diagram-1}
---
diagram: gateway-wire-format
show: [client-openai, wf-gateway, e-openai-gw]
active: [client-openai]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/explanation-understanding-wire-format.html
---

### The default: OpenAI wire format

Any OpenAI SDK — or plain curl — talks to `/openai/v1/chat/completions` on every plan.

## diagram: Gateway → backend {#gw-diagram-2}
---
diagram: gateway-wire-format
add: [wf-model, e-gw-model]
active: [wf-model]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/explanation-understanding-wire-format.html
---

### ai-server speaks the backend's native protocol

Behind the gateway: a vLLM/Ollama Worker VM, or a provider-native call to OpenAI, Bedrock, Azure, Vertex, or Anthropic. The client never knows which.

## diagram: Anthropic-shaped client {#gw-diagram-3}
---
diagram: gateway-wire-format
add: [client-anthropic, e-anthropic-gw]
active: [client-anthropic]
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-create-a-plan-using-the-anthropic-api.html
---

### Same plan, second wire contract

Enable the `experimental-anthropic-wireformat` Active Profile and the same plan answers Anthropic's Messages API too — one backend, multiple client SDKs.

## command: Pass vendor params {#gw-cmd-vendor}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-sending-non-openAI-parameters.html
---

### Provider-specific knobs survive the trip

The gateway is a passthrough, not a schema validator — Gemini's `topK` rides along inside an OpenAI-shaped request.

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
> `topK` isn't in the OpenAI schema at all — Gemini invented it. The gateway forwards it untouched: Gemini's real behavior, the OpenAI SDK's ergonomics.

## command: Call Anthropic's API {#gw-cmd-anthropic}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-create-a-plan-using-the-anthropic-api.html
---

### The same plan via Anthropic's SDK

Flip the experimental profile in Ops Manager (Advanced Config → Active Profiles), then call `/anthropic/v1/messages` — directly, or through the Anthropic Python SDK.

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
> Same platform-hosted model, different wire contract — nothing changed but the SDK the app team wanted. Since 10.4.3, the Anthropic API's default response length is 8192 tokens.
