---
section: Summary
---

## content: Recap {#wrap-recap}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### From a CSV to a running, currency-tracked app

One capability, but it spans the entire lifecycle from "I don't know what's in our portfolio" to "this app is live, and we know exactly what's in it."

- icon:file-text **Portfolio-wide discovery** — A CSV of repo URLs plus business metadata becomes a scored, assessed Repository Group — no per-repo manual triage.
- icon:gauge **A suitability score you can rank by** — Challenges, technical facets, and technical debt roll up into one comparative number, overlaid with business criticality to drive real decisions.
- icon:workflow **One command from candidate to running** — `cf repo onboard-app` detects challenges, offers automatic fixes, and generates the manifest — `mvn package` and `cf push` finish the job.
- icon:shield-check **Currency tracking from day one** — Publishing the onboarding SBOM to Hub means vulnerability and compliance visibility starts the moment an app goes live, not months later.

> [!info] Where this hands off
> This demo stops at "onboarded and currency-tracked." Continuous upgrades from there — SBOM, plan, apply, advice — are the Application Advisor demo's whole story.

## diagram: The full loop {#wrap-diagram}
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
---

### Discovery, scoring, onboarding, currency — one system

Every node here started as a row in a CSV and ended as a running, currency-tracked application — with a human decision (mark as candidate, mark as onboarded) at exactly two points, and automation everywhere else.

## title: Closing {#wrap-closing}
---
eyebrow: Discussion
---

### Questions?

Which repository would you run through this first — and what do you already suspect it'll tell you?
