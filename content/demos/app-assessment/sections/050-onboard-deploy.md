---
section: Onboard & Deploy
---

## content: From "assessed" to "running" {#onboarding-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### The gap this closes: candidate → cf push

Assessment tells you *what's* wrong. Onboarding is the tool that actually prepares a repo to run on Tanzu Platform — detecting a challenge, offering an automatic fix, generating the buildpack manifest, and handing you back a repo that's one `mvn package` and `cf push` away from live.

> [!success] A good candidate for this walkthrough
> `tp-demo` — small, Spring Boot, suitable, and it carries exactly one challenge (Logging to Files) with a recipe available. Mark repos like this as `candidate` in Hub before running any of the commands below.

## command: Get the app {#onboarding-clone}
---
source: https://github.com/bkirkware/tp-demo
---

### Check out the demo branch

```bash label=clone.sh
cd "$TEMP_WORKSPACE"
gh repo clone bkirkware/tp-demo
cd tp-demo
git checkout demo
```

## content: Mark it as a candidate in Hub {#onboarding-mark-candidate}

### One click, before touching the CLI

In `tp-demo`'s repository detail view, check for the challenge (Logging to Files), confirm a recipe is available, then flag it as a **Candidate** — this is what tells the platform, and your team, that onboarding is intentional and in progress.

- icon:gauge **[Tanzu Hub — Repositories]($HUB_URL)** — Find tp-demo, open its detail view, and mark it as Candidate.

## command: Onboard the app {#onboarding-onboard-app}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### `cf repo onboard-app` detects, offers, and fixes

The command inspects the repo, builds a dependency SBOM to pick the right buildpack, and — if it recognizes a fixable challenge — offers to apply the recipe on the spot.

```bash label=onboard-app.sh
cf repo onboard-app
```

> [!impact]
> Expect a prompt: "1 challenge detected: we have an automatic fix for it." Choose yes. Accept every other default — except the jar file path, which needs to match your actual Maven output, e.g. `../target/tp-demo-0.0.1-SNAPSHOT.jar`.

## diagram: What onboard-app just did {#onboarding-diagram-1}
---
diagram: onboarding-lifecycle
visibleNodeIds:
  - candidate
  - onboard
  - manifest
visibleEdgeIds:
  - e-candidate-onboard
  - e-onboard-manifest
activeNodeIds:
  - onboard
  - manifest
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### Step 1 — detection and an offered fix

`onboard-app` reads the repo, recognizes the Logging to Files challenge, and — because a recipe exists for it — offers to apply the fix immediately rather than just reporting it.

## command: Review the changes, then build {#onboarding-review-build}

### Everything onboard-app touched is a plain diff

```bash label=status.sh
git status
```

```bash label=diff.sh
git diff
```

```bash label=build.sh
mvn clean package
```

> [!impact]
> Look for the generated `.tanzu/manifest.yml` and the recipe's fix to the logging configuration — nothing else in the working tree should have changed.

## command: Push, then commit {#onboarding-push}

### A running app, and a paper trail

```bash label=push.sh
cf push -f .tanzu/manifest.yml
```

```bash label=commit.sh
git add .
git commit -m "onboarded"
```

## diagram: Build, push, running {#onboarding-diagram-2}
---
diagram: onboarding-lifecycle
visibleNodeIds:
  - candidate
  - onboard
  - manifest
  - build
  - app
visibleEdgeIds:
  - e-candidate-onboard
  - e-onboard-manifest
  - e-manifest-build
  - e-build-app
activeNodeIds:
  - app
---

### Step 2 — mvn package, then cf push

From the generated manifest to a running app is exactly two commands — the same shape as onboarding any other Java app, because that's exactly what this is now.

## content: Re-assess, and mark it onboarded {#onboarding-reassess}

### Prove the challenge is actually gone

Trigger a fresh assessment on `tp-demo` and confirm the Logging to Files challenge no longer appears — the recipe's fix is committed, not just applied locally. Once confirmed, mark the repo as **Onboarded** in Hub.

- icon:gauge **[Tanzu Hub — Repositories]($HUB_URL)** — Select tp-demo, run Assess, confirm the challenge cleared, then mark it Onboarded.

## diagram: Full loop, closed {#onboarding-diagram-3}
---
diagram: onboarding-lifecycle
visibleNodeIds:
  - candidate
  - onboard
  - manifest
  - build
  - app
  - reassess
  - onboarded
visibleEdgeIds:
  - e-candidate-onboard
  - e-onboard-manifest
  - e-manifest-build
  - e-build-app
  - e-app-reassess
  - e-reassess-onboarded
activeNodeIds:
  - reassess
  - onboarded
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### Step 3 — re-assessment proves the fix landed

The loop closes back in Hub, not on the command line — re-running the same assessment that originally found the challenge is what confirms it's actually resolved, not just locally patched.

## command: Publish the SBOM for currency tracking {#onboarding-publish-sbom}

### The build config becomes Hub's vulnerability & compliance data

The SBOM `onboard-app` generated to pick the right buildpack is the same one that feeds Hub's compliance view. Publishing it needs a handful of environment variables Hub provides from the repository's own detail page.

```bash label=publish-sbom.sh
cf repo publish-sbom
```

> [!impact]
> Grab the required environment variables from the repository's detail page in Hub before running this — they're repo-specific and one-time-setup per repo, not global.

## diagram: The SBOM feeds Hub directly {#onboarding-diagram-4}
---
diagram: currency-reporting-flow
visibleNodeIds:
  - sbom
  - hub
visibleEdgeIds:
  - e-sbom-hub
activeNodeIds:
  - hub
---

### Currency tracking starts the moment you publish

The same build config generated during onboarding, once published, is what populates Hub's vulnerability and compliance view for this repo.

## content: Check compliance and CVEs {#onboarding-hub-check}

### Now visible in the Repositories view

The published SBOM surfaces two things that weren't visible before onboarding: out-of-compliance libraries, and known CVEs against your actual dependency versions.

- icon:shield **[Tanzu Hub — Repositories]($HUB_URL)** — Find tp-demo, check the Latest Analysis column, then drill into components and libraries for anything flagged.

## content: What's next: continuous upgrades {#onboarding-whats-next}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### This is where Application Advisor picks up

The same `cf repo` plug-in that onboarded this app also upgrades it continuously — `upgrade-plan`, `apply-upgrade-plan`, `advice`, `apply-advice`. This demo stops at "onboarded and currency-tracked" on purpose — the full upgrade rhythm (SBOM → plan → apply → test → commit) is its own dedicated demo.

> [!info] A quick preview, if you want it
> `cf repo upgrade-plan` followed by `cf repo apply-upgrade-plan` will pick up right where onboarding left off. See the Application Advisor demo for the full walkthrough, including the javax → jakarta migration and best-practice advice like `spring-governance-starter`.
