import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const gettingStartedSteps: DemoStep[] = [
  {
    id: 'gs-intro',
    type: 'content',
    section: 'Getting Started',
    title: 'Discover & call a model',
    heading: 'From `cf marketplace` to a real response',
    body: "This is the fastest way to prove the platform works: provision a plan, pull credentials with a service key (no app deploy required), and hit the OpenAI-compatible endpoints directly with curl.",
    sourceUrl: `${DOCS}/how-to-guides-discover-models-and-send-openai-requests-to-them.html`,
  },
  {
    id: 'gs-cmd-1',
    type: 'command',
    section: 'Getting Started',
    title: 'Provision & get credentials',
    heading: 'Provision a plan and pull credentials',
    description: "First, see what's on the marketplace, then create a service instance and a service key — the key gives us credentials without deploying an app.",
    commands: [
      {
        label: 'marketplace.sh',
        lang: 'bash',
        code: `cf marketplace -e ai-models`,
        output: `getting service offering details for service ai-models as admin...

service plan   description                                  free or paid
all-models     Access to all configured models on the       free
               platform. Capabilities: chat, embedding, tools.`,
      },
      {
        label: 'provision.sh',
        lang: 'bash',
        code: `cf create-service ai-models all-models all-models
cf create-service-key all-models all-models
cf service-key all-models all-models`,
        output: `Creating service instance all-models in org demo / space demo as admin...
OK

Creating service key all-models for service instance all-models as admin...
OK

Getting key all-models for service instance all-models as admin...

{
 "endpoint": {
  "api_base": "https://genai-proxy.sys.demo.example.com/all-models",
  "openai_api_base": "https://genai-proxy.sys.demo.example.com/all-models/openai",
  "api_key": "eyJhbGciOiJIUzI1NiJ9...",
  "config_url": "https://genai-proxy.sys.demo.example.com/all-models/config/v1/endpoint",
  "name": "all-models"
 }
}`,
      },
    ],
    impact: 'No app was pushed. `cf service-key` alone hands back everything needed to call the model — `openai_api_base` and `api_key` — which is exactly what you would otherwise read out of `VCAP_SERVICES` inside a bound app.',
    sourceUrl: `${DOCS}/how-to-guides-discover-models-and-send-openai-requests-to-them.html`,
  },
  {
    id: 'gs-cmd-2',
    type: 'command',
    section: 'Getting Started',
    title: 'List, chat, embed',
    heading: 'Call the OpenAI-compatible endpoints',
    description: 'With those credentials in hand, list the models actually available on this plan, then send a chat completion and an embedding request — standard OpenAI request/response shapes, regardless of what backend is serving them.',
    commands: [
      {
        label: 'list-models.sh',
        lang: 'bash',
        code: `curl -H "Authorization: Bearer $API_KEY" "$OPENAI_API_BASE/v1/models"`,
        output: `{
  "object": "list",
  "data": [
    {"id": "llama3.2:1b", "object": "model", "created": 1749551541179},
    {"id": "mxbai-embed-large", "object": "model", "created": 1749551541179},
    {"id": "gemini-2.0-flash-lite-001", "object": "model", "created": 1749551541179}
  ]
}`,
      },
      {
        label: 'chat-completion.sh',
        lang: 'bash',
        code: `curl -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  "$OPENAI_API_BASE/v1/chat/completions" -d '{
    "model": "llama3.2:1b",
    "messages": [{"role": "user", "content": "Knock knock."}],
    "temperature": 0.7
  }'`,
        output: `{
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
}`,
      },
      {
        label: 'embedding.sh',
        lang: 'bash',
        code: `curl -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  "$OPENAI_API_BASE/v1/embeddings" -d '{
    "model": "mxbai-embed-large",
    "input": "Hello, world!"
  }'`,
        output: `{
  "object": "list",
  "data": [{"object": "embedding", "index": 0, "embedding": [0.0123, -0.0451, 0.0287, "... 1024 dims"]}],
  "model": "mxbai-embed-large",
  "usage": {"prompt_tokens": 4, "total_tokens": 4}
}`,
      },
    ],
    impact: "Three different capabilities — listing, chat, and embeddings — through one consistent OpenAI-shaped API, no matter whether `llama3.2:1b` is running on a Worker VM down the hall or `gemini-2.0-flash-lite-001` is being proxied from Google Vertex AI.",
    sourceUrl: `${DOCS}/how-to-guides-discover-models-and-send-openai-requests-to-them.html`,
  },
]
