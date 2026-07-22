---
section: How It Works
---

## content: Getting the CLI {#how-cli}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/run-app-advisor-cli.html
---

### One `REGISTRY_TOKEN`, then you're running locally

Both CLI forms ship as a single downloadable binary — Linux, Windows, or macOS (Intel or ARM64). Setup is short.

- icon:key **Get a token** — Pull a `REGISTRY_TOKEN` from the Broadcom Support Portal, following the Spring Enterprise Repository guidelines.
- icon:terminal **Download & extract** — Platform-specific `curl`, then `tar -xf advisor-cli.tar --strip-components=1 --exclude=./META-INF`.
- icon:file-text **Optional Maven config** — Only needed for Spring LTS versions or Tanzu extensions — otherwise 1.6's embedded recipes need no external Maven repo access at all.

> [!success] Air-gapped by default in 1.6
> Commercial recipes are now embedded directly in the CLI binary, so the default upgrade flow works in offline/air-gapped environments with zero external Maven repository access.

## diagram: Point it at a repo {#how-diagram-1}
---
diagram: advisor-upgrade-loop
visibleNodeIds:
  - repo
  - cli
visibleEdgeIds:
  - e-repo-cli
activeNodeIds:
  - cli
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### Step 1 — everything starts from a Git repository

Application Advisor works against a single checked-out repo at a time — a Maven `pom.xml` or Gradle `build.gradle` Spring Boot / Spring Framework project.

## diagram: SBOM, then a plan {#how-diagram-2}
---
diagram: advisor-upgrade-loop
visibleNodeIds:
  - repo
  - cli
  - sbom
  - plan
visibleEdgeIds:
  - e-repo-cli
  - e-cli-sbom
  - e-sbom-plan
activeNodeIds:
  - sbom
  - plan
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### Step 2 — build a dependency SBOM, then an upgrade plan

`cf repo build-sbom` resolves the dependency tree (CycloneDX), required JDK, and build-tool version into `.advisor/build-config.json`. `cf repo upgrade-plan` reads that file and prints the ordered steps needed to reach the latest compatible release.

## diagram: Recipes apply the plan {#how-diagram-3}
---
diagram: advisor-upgrade-loop
visibleNodeIds:
  - repo
  - cli
  - sbom
  - plan
  - recipes
visibleEdgeIds:
  - e-repo-cli
  - e-cli-sbom
  - e-sbom-plan
  - e-plan-recipes
  - e-recipes-repo
activeNodeIds:
  - recipes
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### Step 3 — OpenRewrite recipes apply changes, one step at a time

`cf repo apply-upgrade-plan` runs the next step's OpenRewrite recipes against your working tree — version bumps *and* Java API rewrites (like `javax` → `jakarta`) — while preserving your code style. You review the diff, test, and commit before applying the next step.

## diagram: Advice, Hub, and CI/CD {#how-diagram-4}
---
diagram: advisor-upgrade-loop
visibleNodeIds:
  - repo
  - cli
  - sbom
  - plan
  - recipes
  - advice
  - hub
  - pr
visibleEdgeIds:
  - e-repo-cli
  - e-cli-sbom
  - e-sbom-plan
  - e-plan-recipes
  - e-recipes-repo
  - e-recipes-pr
  - e-sbom-hub
  - e-cli-advice
activeNodeIds:
  - advice
  - hub
  - pr
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/integrations.html
---

### Step 4 — advice, Tanzu Hub, and CI/CD close the loop

Beyond version bumps: `cf repo advice` / `apply-advice` recommends Spring Enterprise extensions like `spring-aot`. Publishing the SBOM to Tanzu Hub surfaces support status and vulnerabilities. And in a pipeline, `--push --from-yml` skips the manual loop entirely and opens a pull request.
