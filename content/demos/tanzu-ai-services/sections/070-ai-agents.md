---
section: AI Agents
---

## content: Zero-code chat agents {#agent-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
links:
  - label: Spring AI
    url: https://spring.io/projects/spring-ai
---

### The Agent Buildpack

`agent_buildpack` (Technical Preview) turns a pushed app into a chat-UI agent: write an `AGENTS.md` system prompt, `cf push`, bind a model plan. No application code.

> [!info] Spring AI, for comparison
> Prefer writing the app yourself? `java-cfenv` v3.2.0+ auto-wires Spring AI straight from `VCAP_SERVICES` — create, bind, restage, no credential parsing.

## command: Deploy an agent {#agent-cmd-deploy}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/tutorials-deploy-an-ai-agent.html
---

### Push, bind a model, bind a tool

The highest-impact live moment on the platform: a chat UI from zero code, gaining tools the moment an MCP server is bound.

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
> Two restages, zero lines of code: degraded mode → working chat model → tool-using agent with live GitHub access, purely through `cf bind-service`.

## discussion: What would you automate? {#agent-discussion}

If a working chat agent takes two `cf push` cycles and no code — what internal tool does your team wire up first?

- An MCP server over an existing REST API turns any legacy service into an agent tool, no rewrite
- The buildpack is Technical Preview — prototype now, evaluate GA timing for production
- Bindings are self-describing (`config_url` returns live model + wire-format info), so agents adapt when the plan changes
