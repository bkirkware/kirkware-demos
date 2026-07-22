---
section: Understanding the Assessment
---

## content: Three signals, one score {#assessment-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### What actually produces a suitability score

A repo's suitability score isn't a single rule firing — it's a rollup of everything the assessment engine found, weighted by severity.

- icon:shield **Challenges** — Specific, actionable problems — a hardcoded file-system write, a J2EE dependency, a `javax.*` import — each with a severity and, sometimes, a recipe.
- icon:database **Technical Facets** — Discovery, not judgment: languages, frameworks, databases, and other technology-stack characteristics. A facet isn't good or bad, just true.
- icon:layers **Technical Debt** — Anti-patterns and code-maintenance concerns that make an app harder to work on, independent of whether they block a cloud move.

> [!info] Suitability is a comparative scale
> The score estimates relative effort to remediate everything found — it is explicitly not an estimate of man-hours or days. Use it to rank repos against each other, not to build a project plan.

## diagram: The suitability model {#assessment-diagram-1}
---
diagram: suitability-model
visibleNodeIds:
  - challenges
  - facets
  - debt
  - score
visibleEdgeIds:
  - e-challenges-score
  - e-facets-score
  - e-debt-score
activeNodeIds:
  - score
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/app-port-onboard-overview.html
---

### Step 1 — three signals roll up into one score

Challenges, technical facets, and technical debt each feed the score — none of them alone tells the whole story.

## content: Challenge severity {#assessment-severity}

### Four levels, and what each one means for you

Not every challenge deserves the same response — severity is what tells you where to look first.

- icon:sparkles **Low (with recipe)** — The cheapest win available: an automated fix exists, reviewed as a diff. Start here.
- icon:shield **Medium** — Well-understood by the platform team, with a documented recipe to review and apply — not fully automatic, but not a mystery either.
- icon:shield-check **High** — Typically requires deeper review — solution alternatives that may vary per organization, not a one-size recipe.
- icon:help-circle **Blocker** — A hard stop for platform suitability as-is. Avoid marking these as onboarding candidates until addressed.

> [!success] A good first candidate
> Start with high-suitability repos that have a recipe available. If none exist, look at medium-suitability repos next — and steer clear of anything carrying a blocker.

## diagram: Where business context enters {#assessment-diagram-2}
---
diagram: suitability-model
visibleNodeIds:
  - challenges
  - facets
  - debt
  - score
  - biz
  - decision
visibleEdgeIds:
  - e-challenges-score
  - e-facets-score
  - e-debt-score
  - e-biz-decision
  - e-score-decision
activeNodeIds:
  - biz
  - decision
---

### Step 2 — the score alone doesn't decide anything

The same suitability score means something different for a low-criticality internal tool versus a high-criticality revenue system. Business criticality and cost/investment — both from the intake CSV — overlay the technical score to drive the actual lift-and-shift / modernize / divest call.

## content: Rules — what actually detects a challenge {#assessment-rules}

### Pattern matching, not magic

Every challenge traces back to a rule — most are regular-expression pattern matches against source files, dependency manifests, or configuration. Open any triggered rule to see exactly what matched and why, and the specific advice tied to it.

- icon:sparkles **java-springboot-controllers** — An example of a suitable-signal rule — detects Spring Boot REST controllers, a strong "already cloud-shaped" indicator.
- icon:file-text **java-file-io-write** — Flags direct filesystem writes — a twelve-factor violation in general, but not universally: some orgs treat this as an intentional feature for specific app types.
- icon:boxes **J2EE / server dependency rules** — Detect application-server-coupled code (EJBs, IWA, desktop dependencies) — usually High severity or a Blocker, since these require real architectural change.

> [!info] Rules are tunable per Repository Group
> If a rule doesn't fit your org — `java-file-io-write` being a deliberate feature for one team, for instance — change its effort to zero, edit its advice, or ignore it entirely, scoped to the group it applies to.

## question: What would a custom rule catch for you? {#assessment-question}

Beyond the built-in rules, what's a pattern specific to your organization — a deprecated internal library, a banned dependency, a naming convention — that would be worth detecting as its own challenge or facet?

- Custom rules today are pattern/regex-based against source and dependency files, scoped to a Repository Group
- A custom rule can be styled as a challenge (something to fix), a debt (something to track), or a facet (something to simply know)
- Richer custom tagging is on the roadmap — today's custom rules cover the pattern-matching case well, not every possible signal yet
