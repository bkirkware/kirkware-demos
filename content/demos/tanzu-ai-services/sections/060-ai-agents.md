---
section: AI Agents
---

## content: Zero-code chat agents {#agent-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### The AI Agent buildpack

`agent_buildpack` (Technical Preview) turns any pushed app into a chat-UI agent. Write an `AGENTS.md` describing the agent's system prompt, `cf push`, then bind a model plan — no application code required at all.

> [!info] Spring AI, for comparison
> If you'd rather write the app yourself, `java-cfenv` v3.2.0+ auto-wires a Spring AI app straight from `VCAP_SERVICES`: `cf create-service ai-models llama3.1 my-llama3.1` → `cf bind-service my-spring-ai-app my-llama3.1` → `cf restage` — no manual credential parsing in code.

## command: Deploy an agent live {#agent-cmd-deploy}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### Push, bind a model, bind an MCP tool

This is the single highest-impact live moment in the whole platform: a chat UI appears with zero app code, and gains tool-calling ability the moment you bind an MCP server.

```bash label=setup
mkdir my-agent && cd my-agent
```

```markdown label=AGENTS.md
You are a helpful assistant. Answer questions concisely and accurately.
```

```yaml label="manifest.yml (optional)"
applications:
- name: my-agent
  buildpacks:
  - agent_buildpack
```

```bash label=push
cf push my-agent
```

```output
Pushing app my-agent...
Staging app and tracing logs...
   [APP] Agent started in degraded mode: no model bound yet
Waiting for app to start...

name:              my-agent
requested state:   started
routes:             my-agent.apps.demo.example.com
type:              web
instances:         1/1
memory usage:      256M
```

```bash label=bind-model
cf marketplace -e ai-models
cf create-service ai-models all-models my-agent-model
cf bind-service my-agent my-agent-model
cf restage my-agent
```

```output
Binding service my-agent-model to app my-agent...
OK
Restaging app my-agent...
   [APP] Agent fully functional — chat model bound: all-models

my-agent.apps.demo.example.com now serves a working chat UI.
```

```bash label=bind-mcp-tool
cf cups github-mcp-tool \
 -p '{"url":"https://github-mcp.apps.internal/mcp"}' \
 -t "mcp-server"

cf bind-service my-agent github-mcp-tool
cf restage my-agent
```

```output
Creating user provided service github-mcp-tool...
OK
Binding service github-mcp-tool to app my-agent...
OK
Restaging app my-agent...
   [APP] Discovered MCP server "github-mcp-tool" — 12 tools now available in chat

my-agent.apps.demo.example.com now shows GitHub tools in the chat UI.
```

> [!impact]
> Two restages, zero lines of application code: first the agent goes from "degraded mode" to a working chat model, then from a plain chatbot to a tool-using agent with live GitHub access — purely through `cf bind-service`.

## discussion: What would you automate? {#agent-discussion}

If deploying a working chat agent takes two `cf push` cycles and no code, what internal tool would your team wire up first?

- Internal MCP servers over existing REST APIs turn any legacy service into an agent tool with no rewrite
- The buildpack is Technical Preview — great for prototyping, evaluate GA timing for production commitments
- Binding credentials are self-describing (`config_url` returns live model + wire-format info), so agents can adapt if the bound plan changes
