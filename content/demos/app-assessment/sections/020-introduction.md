---
section: Introduction
---

## title: Welcome {#intro-title}
---
eyebrow: Tanzu Hub · App Portfolio Assessment & Onboarding
---

### Application Assessment

Discover, score, and onboard applications across a whole portfolio — from a CSV of repository URLs to a running app on Tanzu Platform, without a fleet of engineers manually triaging one repo at a time.

- Portfolio-wide discovery
- Suitability scoring
- One-command onboarding
- Live in Tanzu Hub

## content: Prerequisites {#intro-prerequisites}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-getting-started.html
---

### What has to be true before any of this works

None of these are covered by this demo — they're assumed to already be in place.

- icon:server **Access to Tanzu Hub** — A `$HUB_URL` you can reach, with App Portfolio Assessment RBAC permissions granted to your account.
- icon:key **Git repository credentials** — An API token (or username/password) for whichever provider hosts the repos you'll scan — GitHub, GitLab, Bitbucket, or TFS.
- icon:terminal **cf CLI with the repo plug-in** — Installed and authenticated to your Cloud Foundry foundation — `cf repo onboard-app` and friends come from this plug-in.
- icon:cpu **A JDK and Maven on hand** — The live onboarding walkthrough builds a real Spring Boot app locally before pushing it.
- icon:file-text **A Spring Enterprise Maven token** — Refreshed in `~/.m2/settings.xml` if onboarding recommends any Tanzu Spring extensions — the same requirement as the Application Advisor demo.

> [!info] This pairs with, but isn't, the Application Advisor demo
> Application Assessment answers "which of my hundreds of repos are worth onboarding, and what's wrong with them?" Application Advisor answers "now that this one app is on Spring, how do I keep it upgraded?" This demo gets you to a running, onboarded app — the other demo picks up from there.

## content: Three problems, one capability {#intro-why}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### What App Portfolio Assessment actually does

It exists to answer questions a spreadsheet can't: across an entire portfolio, not one app at a time.

- icon:database **Discovery & Assessment** — Identify languages, frameworks, and modernization challenges across every repository — not just the ones someone remembered to flag.
- icon:shield **Risk & Cost Reduction** — Surface security vulnerabilities and infrastructure inefficiencies in legacy systems before they become incidents.
- icon:layers **Operational Consolidation** — Reduce platform variants and datacenter footprint by grouping repos into modernization waves with shared technical characteristics.

> [!info] A challenge, defined
> Every "challenge" this tool flags traces back to the twelve-factor app guidance for moving workloads to the cloud — recently refined to align with the latest Tanzu Platform. A challenge can carry an automatic remediation recipe, or it can be well-understood-but-manual, or it can be a genuine blocker requiring a design decision.

## discussion: Where does your portfolio actually stand? {#intro-discussion}

Think about how your organization currently knows which of its hundreds of internal apps are cloud-ready. Is that answer written down anywhere, or does it live in a few people's heads?

- Most orgs can name their five most critical apps in detail, but have no systematic view of the other three hundred
- Suitability scoring plus business criticality (from the intake CSV) gives portfolio owners a way to prioritize without reading every repo by hand
- A recipe-available challenge is the cheapest possible win: automated remediation, reviewed as a diff, no design discussion required
