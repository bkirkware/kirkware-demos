---
section: Integrations
---

## content: Continuous, unattended upgrades {#int-cicd}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/integrations.html
---

### From a manual loop to a pipeline step

The same commands from the live walkthrough collapse into a CI/CD step once a repo is trusted to upgrade itself. GitLab Enterprise, GitHub Enterprise, Jenkins, Bitbucket, and generic SaaS CI are all supported.

- icon:key **GIT_TOKEN_FOR_PRS** — An access token with repo write permission — the CLI uses it to create branches and open pull requests on your behalf.
- icon:file-text **.spring-app-advisor.yml** — Drop this in the repo root with `enabled: true` to opt it into continuous upgrades.
- icon:server **ADVISOR_SCM_HOST** — Set alongside the token for self-hosted GitHub Enterprise / GitLab instances.

## command: The pipeline version of today's walkthrough {#int-cicd-cmd}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### Three commands replace the whole manual loop

Everything demonstrated live above — build config, upgrade plan, apply, review, test, commit — becomes this, running unattended on every pipeline trigger.

```bash label=pipeline-upgrade.sh
cf repo build-sbom
cf repo publish-sbom
cf repo apply-upgrade-plan --push --from-yml
```

> [!impact]
> `--push --from-yml` reads `.spring-app-advisor.yml`, applies the next eligible step, and opens the pull request itself — no human runs `git diff` until review time.

## diagram: The pipeline, end to end {#int-cicd-diagram}
---
diagram: advisor-cicd-flow
visibleNodeIds:
  - main-branch
  - ci-job
  - advisor-cli
  - artifact-mgr
  - pr-node
  - review
visibleEdgeIds:
  - e-main-ci
  - e-ci-cli
  - e-cli-artifact
  - e-cli-pr
  - e-pr-review
  - e-review-main
activeNodeIds:
  - advisor-cli
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/app-advisor-architecture.html
---

### A push in, a reviewed PR out

Every upgrade opportunity opens a new pull request instead of editing `main` directly — a human still reviews and merges. The CLI runs entirely inside the CI job: no source code is ever transferred anywhere, it only resolves OpenRewrite recipes from your artifact manager.

## content: Tanzu Hub & the IDE {#int-hub-ide}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/integrations.html
---

### Two more ways in: a fleet-wide dashboard, and inline in the editor

- icon:gauge **[Tanzu Hub]($HUB_URL)** — `publish-sbom` sends the build config to Tanzu Hub, surfacing support status and known vulnerabilities across every onboarded repo in one place.
- icon:bot **IDE via MCP** — Model Context Protocol integration lets a developer run upgrade plans and apply best-practice advice from inside their editor, no terminal context-switch required.
