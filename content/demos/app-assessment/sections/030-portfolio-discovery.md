---
section: Portfolio Discovery
---

## content: Repository Groups {#discovery-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-app-port-scale.html
---

### The unit of everything: a Repository Group

A Repository Group is a named collection of repos — usually aligned to a team, a business unit, or a line of business — plus the business metadata that makes the results meaningful to a portfolio owner, not just an engineer. RBAC scopes access per group, so a team only ever sees its own portfolio.

- icon:git-branch **Source of truth: Git** — The actual repository URLs — GitHub, GitLab, Bitbucket, or TFS. This is what gets scanned.
- icon:file-text **Business context: the CSV** — App name, business criticality, the business application it rolls up to, technical/business owners, and a cost/investment designation — everything a dashboard needs to matter to a non-engineer.

> [!info] Scale numbers, for context
> Up to 8,000 repositories across all groups on an Enterprise install, up to 1,000 small repos (<1MB) per group, with up to five repositories assessed in parallel. Anything over 750MB should be assessed on its own; groups over 500 repos should be saved before running the assessment.

## diagram: From CSV to Repository Group {#discovery-diagram-1}
---
diagram: portfolio-intake-flow
visibleNodeIds:
  - csv
  - repogroup
visibleEdgeIds:
  - e-csv-repogroup
activeNodeIds:
  - repogroup
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-getting-started.html
---

### Step 1 — the CSV creates the group

Uploading the CSV during group creation is the entire "get my portfolio into Hub" step — no per-repo manual entry.

## content: What goes in the CSV {#discovery-csv-fields}

### One row per repository

The same input file works whether you're onboarding two repos or two thousand.

- icon:git-branch **Repository URL** — HTTPS only. The `Branch` and `Subfolder` columns handle monorepos and non-default branches.
- icon:file-text **App Name** — What shows up in every Hub view — independent of the repo's actual name.
- icon:users **Business Criticality & Business App** — Rolls individual repos up into the business application they serve, and how critical that application is.
- icon:key **Technical & Business Owner** — Who to talk to about this repo — one technical contact, one business contact.
- icon:bar-chart **Cost & Investment** — Whether the business is planning to Invest in or Divest from this application — feeds directly into the modernize-vs-lift-and-shift-vs-divest decision later.
- icon:gauge **[See it live]($HUB_URL)** — Navigate to App Portfolio Assessment → Repository Groups → Create Repository Group to see this upload step live.

## content: Create without assessing, then assess separately {#discovery-create-group}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-getting-started.html
---

### Two clicks, not one, when you're demoing

Repository Group creation and running the assessment are separate steps — useful for a demo (create first, narrate, assess second) and useful in production (stage a large group, then kick off assessment during a maintenance window).

- icon:boxes **1. Create Repository Group** — Name it, describe it, pick the Git provider, upload the CSV, add credentials.
- icon:gauge **2. Choose: assess now, or later** — "Create and Analyze" runs the assessment immediately; "Create" alone just registers the group.
- icon:workflow **3. Assess — individually, in bulk, or the whole group** — The Repositories tab's action menu covers all three granularities once the group exists.

## diagram: Triggering the assessment {#discovery-diagram-2}
---
diagram: portfolio-intake-flow
visibleNodeIds:
  - csv
  - repogroup
  - git
  - scanner
  - hub
visibleEdgeIds:
  - e-csv-repogroup
  - e-repogroup-scanner
  - e-scanner-git
  - e-scanner-hub
activeNodeIds:
  - scanner
  - hub
---

### Step 2 — the engine reads real source code

Once triggered, the assessment engine clones and statically analyzes every repo in the group — languages, frameworks, dependency manifests, and every rule in the engine's ruleset — and publishes the results back to Hub.

## content: The Summary landing page {#discovery-hub-summary}

### One dashboard, every portfolio

Once results land, the Summary page aggregates across every Repository Group you have access to.

- icon:gauge **[Tanzu Hub — App Portfolio Assessment]($HUB_URL)** — Suitability, business criticality, technical facets, and technical debt — all cross-cut, so a critical app with a blocker-severity challenge stands out from a low-priority app with the same challenge.

## discussion: What would your first Repository Group be? {#discovery-discussion}

If you had to pick one real team or business unit to run through this today, which one — and would you scope it by team, by business application, or by technology stack?

- RBAC is scoped per Repository Group — this is also an access-control decision, not just an organizational one
- A diverse first group (mixed languages and frameworks) shows off more of the dashboard; a narrow first group (one team's repos) is easier to validate against what that team already knows
- Nothing about a Repository Group is permanent — repos can move between groups, and groups can be re-scoped later
