import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const gatewaySteps: DemoStep[] = [
  {
    id: 'gw-intro',
    type: 'content',
    section: 'Gateway & Wire Formats',
    title: 'One gateway, many wire formats',
    heading: "It's not a lowest-common-denominator gateway",
    body: "Two independent layers matter here: the **client-facing wire format** (what your app sends) and the **backend wire format** (hardcoded per provider). ai-server translates between them — and, critically, doesn't strip fields it doesn't recognize.",
    bullets: [
      { title: 'OpenAI API Plans', icon: 'braces', description: 'Base URL `{api_base}/openai` — `POST /v1/chat/completions`, `POST /v1/embeddings`, `GET /v1/models`. Config reports `"wireFormat": "OPENAI"`.' },
      { title: 'Anthropic API Plans', icon: 'sparkles', description: 'Experimental as of 10.4.2 — base URL `{api_base}/anthropic`, `POST /v1/messages`. Requires the `experimental-anthropic-wireformat` Active Profile.' },
    ],
    sourceUrl: `${DOCS}/explanation-understanding-wire-format.html`,
  },
  {
    id: 'gw-diagram-1',
    type: 'diagram',
    section: 'Gateway & Wire Formats',
    title: 'OpenAI-shaped client',
    heading: 'Step 1 — the default: OpenAI wire format',
    diagramId: 'gateway-wire-format',
    narrative: 'Any OpenAI SDK, or plain curl, talks to `/openai/v1/chat/completions` — the default wire format for every plan.',
    visibleNodeIds: ['client-openai', 'wf-gateway'],
    visibleEdgeIds: ['e-openai-gw'],
    activeNodeIds: ['client-openai'],
    sourceUrl: `${DOCS}/explanation-understanding-wire-format.html`,
  },
  {
    id: 'gw-diagram-2',
    type: 'diagram',
    section: 'Gateway & Wire Formats',
    title: 'Gateway → backend model',
    heading: 'Step 2 — ai-server speaks the backend’s native protocol',
    diagramId: 'gateway-wire-format',
    narrative: 'Behind the gateway, ai-server calls whichever backend is actually bound to the plan — a vLLM/Ollama Worker VM, or a provider-native call to OpenAI, Bedrock, Azure, Vertex, or Anthropic. The client never needs to know which.',
    visibleNodeIds: ['client-openai', 'wf-gateway', 'wf-model'],
    visibleEdgeIds: ['e-openai-gw', 'e-gw-model'],
    activeNodeIds: ['wf-model'],
    sourceUrl: `${DOCS}/explanation-understanding-wire-format.html`,
  },
  {
    id: 'gw-diagram-3',
    type: 'diagram',
    section: 'Gateway & Wire Formats',
    title: 'Anthropic-shaped client',
    heading: 'Step 3 — the same model, a second wire contract',
    diagramId: 'gateway-wire-format',
    narrative: "Enable the `experimental-anthropic-wireformat` Active Profile and the exact same plan is now reachable via Anthropic's Messages API too — one backend, multiple client SDKs.",
    visibleNodeIds: ['client-openai', 'wf-gateway', 'wf-model', 'client-anthropic'],
    visibleEdgeIds: ['e-openai-gw', 'e-gw-model', 'e-anthropic-gw'],
    activeNodeIds: ['client-anthropic'],
    sourceUrl: `${DOCS}/how-to-guides-create-a-plan-using-the-anthropic-api.html`,
  },
  {
    id: 'gw-cmd-vendor',
    type: 'command',
    section: 'Gateway & Wire Formats',
    title: 'Vendor-specific params',
    heading: 'Passing provider-specific parameters through',
    description: "The gateway is a passthrough, not a strict schema validator — unknown fields survive the trip. That means you can use provider-specific knobs, like Gemini's `topK`, while keeping the OpenAI SDK shape.",
    commands: [
      {
        label: 'curl',
        lang: 'bash',
        code: `curl "$OPENAI_API_BASE/v1/chat/completions" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $API_KEY" \\
-d '{
      "model": "gemini-2.5-flash",
      "messages": [{"role": "user", "content": "Explain to me how AI works"}],
      "topK": 20
    }'`,
        output: `{
  "id": "chatcmpl-2b91...",
  "object": "chat.completion",
  "model": "gemini-2.5-flash",
  "choices": [{"index": 0, "message": {"role": "assistant", "content": "At its core, AI works by..."}, "finish_reason": "stop"}]
}`,
      },
      {
        label: 'python (openai SDK)',
        lang: 'python',
        code: `response = client.chat.completions.create(
    model="gemini-2.5-flash",
    messages=[{"role": "user", "content": "Explain to me how AI works"}],
    extra_body={'topK': 20}
)`,
      },
    ],
    impact: "`topK` isn't part of the OpenAI chat-completions schema at all — Gemini invented it. The gateway forwards it untouched, so you get Gemini's actual behavior without giving up the OpenAI SDK's ergonomics.",
    sourceUrl: `${DOCS}/how-to-guides-sending-non-openAI-parameters.html`,
  },
  {
    id: 'gw-cmd-anthropic',
    type: 'command',
    section: 'Gateway & Wire Formats',
    title: 'Anthropic Messages API',
    heading: 'Calling the same plan via Anthropic’s SDK',
    description: 'First flip on the experimental profile in Ops Manager (Advanced Config → Active Profiles), then call `/anthropic/v1/messages` directly, or through the Anthropic Python SDK pointed at the gateway as its base URL.',
    commands: [
      {
        label: 'Active Profiles (before → after)',
        lang: 'text',
        code: `Before: ga-providers,ga-rules,config-api,manage-ui,audit
After:  ga-providers,ga-rules,config-api,manage-ui,audit,experimental-anthropic-wireformat`,
      },
      {
        label: 'curl',
        lang: 'bash',
        code: `curl -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  "$API_BASE/anthropic/v1/messages" -d '{
     "model": "'"$MODEL_NAME"'",
     "max_tokens": 1024,
     "messages": [{"role": "user", "content": "What is the capital of France?"}]
   }'`,
        output: `{
  "id": "msg_01XFDUD...",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet",
  "content": [{"type": "text", "text": "The capital of France is Paris."}],
  "stop_reason": "end_turn"
}`,
      },
      {
        label: 'python (anthropic SDK)',
        lang: 'python',
        code: `import anthropic
client = anthropic.Anthropic(api_key=API_KEY, base_url=f"{API_BASE}/anthropic")
message = client.messages.create(
    model=MODEL_NAME, max_tokens=1024,
    messages=[{"role": "user", "content": "What is the capital of France?"}],
)
print(message.content[0].text)`,
      },
    ],
    impact: 'The exact same platform-hosted model now answers through a completely different wire contract. Nothing about the model or the plan changed — only which SDK the app team wanted to use.',
    sourceUrl: `${DOCS}/how-to-guides-create-a-plan-using-the-anthropic-api.html`,
  },
]
