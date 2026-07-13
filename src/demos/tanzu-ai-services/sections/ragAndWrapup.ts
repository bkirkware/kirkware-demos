import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const ragAndWrapupSteps: DemoStep[] = [
  {
    id: 'rag-intro',
    type: 'content',
    section: 'Multi-Model Plans & RAG',
    title: 'Multi-model plans',
    heading: 'Bundling a chat model and an embedding model',
    body: "Before v10.2.0, plans were strictly one model each — a RAG-style app needing both chat and embeddings meant two service instances and two bindings. Multi-model plans bundle several models (for example a chat model on Azure plus an embedding model on Ollama) behind **one** binding.",
    bullets: [
      { title: 'Before 10.2', icon: 'boxes', description: 'One model per plan — a chat+embedding app needs two service instances, two bindings, double the marketplace sprawl.' },
      { title: '10.2.0+', icon: 'layers', description: '"You halve the number of service instances and service plans" — one bind exposes every model the plan bundles.' },
    ],
    callout: {
      label: "Don't overclaim: RAG isn't a platform feature",
      tone: 'warning',
      body: "There is no dedicated RAG pipeline in Tanzu AI Services — no vector database, no chunking or retrieval service. Multi-model plans get you the chat model and the embedding-model endpoint behind one binding; the retrieval/vector-store orchestration is still your application's job (e.g. via Spring AI). Be explicit about this boundary with the audience.",
    },
    sourceUrl: `${DOCS}/explanation-single-vs-multi-model-plans.html`,
  },
  {
    id: 'rag-question',
    type: 'question',
    section: 'Multi-Model Plans & RAG',
    title: 'Setting expectations',
    prompt: 'Given that the platform provides model-serving and embeddings but not retrieval orchestration — where would you draw the line for what your application layer needs to own?',
    hints: [
      'Vector store choice, chunking strategy, and retrieval ranking remain application/framework concerns (e.g. Spring AI, LangChain)',
      'What the platform reliably gives you: one binding, consistent credentials, and both model types behind the same plan',
      'A good follow-up question for the room: would a future release adding a managed vector store change your architecture?',
    ],
  },
  {
    id: 'wrap-recap',
    type: 'content',
    section: 'Wrap-up',
    title: 'Recap & roadmap',
    heading: 'Where the platform is headed',
    body: "A few threads worth calling back to as you close: several capabilities shown today are Experimental or Technical Preview, and the platform's own naming is still catching up with its scope.",
    bullets: [
      { title: 'Anthropic API Plans', icon: 'sparkles', description: 'Experimental as of 10.4.2 — Messages API wire format alongside the default OpenAI format.' },
      { title: 'AI Agent buildpack', icon: 'bot', description: 'Technical Preview — zero-code chat agents, now with SSO and bearer-token MCP auth options.' },
      { title: 'Off-platform MCP OAuth', icon: 'key', description: 'Technical Preview — forward_token and oauth_passthrough auth modes for off-platform MCP servers.' },
      { title: 'Naming migration', icon: 'git-branch', description: 'The marketplace offering was renamed `genai` → `ai-models` in 10.4.0. Prefer the stable `tanzu-ai-models` / `tanzu-mcp-gateway` tags over offering-name lookups going forward.' },
    ],
    callout: {
      label: 'Support boundary, stated plainly',
      tone: 'info',
      body: "Broadcom supports deployment and configuration of specific released vLLM/Ollama versions on GPU hardware. Choosing the right model for a use case, hardware compatibility validation, and performance tuning are explicitly the customer's responsibility.",
    },
    sourceUrl: `${DOCS}/release-notes.html`,
  },
  {
    id: 'wrap-closing',
    type: 'title',
    section: 'Wrap-up',
    title: 'Closing',
    eyebrow: 'Discussion',
    heading: 'Questions?',
    subheading: 'What would it take to get Tanzu AI Services onto your platform roadmap?',
  },
]
