---
section: Introduction
---

## title: Welcome {#intro-title}
---
eyebrow: VMware Tanzu Spring · Application Advisor 1.6
---

### Application Advisor

Continuously and incrementally upgrade Spring dependencies across every Git repository you own — without a fleet of engineers hand-rolling version bumps one repo at a time.

- Automated Upgrades
- Cross-Repo Safety
- Best-Practice Advice
- Air-Gapped Ready

## content: Four core operations {#intro-why}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/what-is-app-advisor.html
---

### What Application Advisor actually does

Application Advisor is an upgrade **orchestrator**, not just a dependency bot — it prevents stale or invalid pull requests caused by dependency conflicts across your whole fleet of repos. Under the hood it runs four operations.

- icon:database **Dependency Analysis** — Generates a CycloneDX dependency tree, JDK version, and build tool version for a repo — the "build config" / SBOM.
- icon:layers **Upgrade Planning** — Computes which Spring dependencies and tools must move together to reach the next compatible release, broken into ordered steps.
- icon:sparkles **Code Refactoring** — Applies dependency version bumps and Java API rewrites using OpenRewrite recipes — as of 1.6, embedded directly in the CLI binary for air-gapped use.
- icon:git-branch **Pull Request Creation** — In CI/CD mode, automatically opens a PR with the refactored changes instead of just editing the working tree.

> [!info] Two CLIs, one product
> Tanzu Spring Enterprise customers run the standalone `advisor` CLI. Tanzu Platform customers run the same capability as `cf repo` commands via the `repo` plug-in. The commands are equivalent for most upgrade and analysis workflows — this demo uses the `cf repo` form throughout.

## discussion: Where does upgrade pain live today? {#intro-discussion}

Think about your oldest production Spring app — what actually stops it from being upgraded?

- Nobody wants to spend a sprint hand-editing pom.xml/build.gradle across dozens of repos for one version bump
- The javax → jakarta migration alone (Spring Boot 2.7 → 3.0) touches imports across the whole codebase — exactly the kind of mechanical change a recipe engine should own
- Shared internal libraries create a "who moves first" deadlock: nobody upgrades because nobody else has, until Application Advisor computes the safe order for you
