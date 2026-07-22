---
section: Getting Started
---

## content: Discover & call a model {#gs-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-discover-models-and-send-openai-requests-to-them.html
---

### From `cf marketplace` to a real response

This is the fastest way to prove the platform works: provision a plan, pull credentials with a service key (no app deploy required), and hit the OpenAI-compatible endpoints directly with curl.

## command: Provision & get credentials {#gs-cmd-1}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-discover-models-and-send-openai-requests-to-them.html
---

### Provision a plan and pull credentials

First, see what's on the marketplace, then create a service instance and a service key — the key gives us credentials without deploying an app.

```bash label=marketplace.sh live=marketplace.sh
cf marketplace -e ai-models
```

```output
getting service offering details for service ai-models as admin...

service plan   description                                  free or paid
all-models     Access to all configured models on the       free
               platform. Capabilities: chat, embedding, tools.
```

```bash label=provision.sh
cf create-service ai-models kirkware-all-models kirkware-all-models
cf create-service-key kirkware-all-models kirkware-all-models
```

```output
Creating service instance kirkware-all-models in org demo / space demo as admin...
OK

Creating service key kirkware-all-models for service instance kirkware-all-models as admin...
OK
```

```bash label=service-key.sh live=service-key.sh
cf service-key kirkware-all-models kirkware-all-models
```

```output
Getting key kirkware-all-models for service instance kirkware-all-models as admin...

{
  "credentials": {
    "endpoint": {
      "api_base": "https://genai-proxy.sys.demo.example.com/kirkware-all-models",
      "openai_api_base": "https://genai-proxy.sys.demo.example.com/kirkware-all-models/openai",
      "api_key": "eyJhbGciOiJIUzI1NiJ9...",
      "config_url": "https://genai-proxy.sys.demo.example.com/kirkware-all-models/config/v1/endpoint",
      "name": "kirkware-all-models"
    }
  }
}
```

> [!impact]
> No app was pushed. `cf service-key` alone hands back everything needed to call the model — `openai_api_base` and `api_key` — which is exactly what you would otherwise read out of `VCAP_SERVICES` inside a bound app.

## command: List, chat, embed {#gs-cmd-2}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/how-to-guides-discover-models-and-send-openai-requests-to-them.html
---

### Call the OpenAI-compatible endpoints

With those credentials in hand, list the models actually available on this plan, then send a chat completion and an embedding request — standard OpenAI request/response shapes, regardless of what backend is serving them.

```bash label=list-models.sh live=list-models.sh
curl -H "Authorization: Bearer $API_KEY" "$OPENAI_API_BASE/v1/models"
```

```output
{
  "object": "list",
  "data": [
    {"id": "llama3.2:1b", "object": "model", "created": 1749551541179},
    {"id": "mxbai-embed-large", "object": "model", "created": 1749551541179},
    {"id": "gemini-2.0-flash-lite-001", "object": "model", "created": 1749551541179}
  ]
}
```

```bash label=chat-completion.sh
curl -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  "$OPENAI_API_BASE/v1/chat/completions" -d '{
    "model": "llama3.2:1b",
    "messages": [{"role": "user", "content": "Knock knock."}],
    "temperature": 0.7
  }'
```

```output
{
  "id": "chatcmpl-8f3a...",
  "object": "chat.completion",
  "model": "llama3.2:1b",
  "choices": [
    {
      "index": 0,
      "message": {"role": "assistant", "content": "Who's there?"},
      "finish_reason": "stop"
    }
  ],
  "usage": {"prompt_tokens": 11, "completion_tokens": 4, "total_tokens": 15}
}
```

```bash label=embedding.sh
curl -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  "$OPENAI_API_BASE/v1/embeddings" -d '{
    "model": "mxbai-embed-large",
    "input": "Hello, world!"
  }'
```

```output
{
  "object": "list",
  "data": [{"object": "embedding", "index": 0, "embedding": [0.0123, -0.0451, 0.0287, "... 1024 dims"]}],
  "model": "mxbai-embed-large",
  "usage": {"prompt_tokens": 4, "total_tokens": 4}
}
```

> [!impact]
> Three different capabilities — listing, chat, and embeddings — through one consistent OpenAI-shaped API, no matter whether `llama3.2:1b` is running on a Worker VM down the hall or `gemini-2.0-flash-lite-001` is being proxied from Google Vertex AI.
