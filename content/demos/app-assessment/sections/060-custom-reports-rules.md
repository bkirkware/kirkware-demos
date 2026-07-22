---
section: Custom Reports & Rules
---

## content: Beyond the built-in dashboards {#reporting-intro}

### The same data, queried your way

Every chart in the Summary and Repositories views is backed by a GraphQL API — the same one available to you directly, for the questions the built-in views don't already answer.

## diagram: Rules feed reports feed decisions {#reporting-diagram}
---
diagram: currency-reporting-flow
visibleNodeIds:
  - sbom
  - hub
  - rules
  - graphql
  - reports
visibleEdgeIds:
  - e-sbom-hub
  - e-rules-hub
  - e-hub-graphql
  - e-graphql-reports
activeNodeIds:
  - rules
  - graphql
  - reports
---

### The full loop, from custom rule to custom report

Custom rules flag challenges the same way built-in rules do — that data lands in Hub, is queryable via GraphQL, and powers both custom reports and the Playground.

## content: Querying directly {#reporting-graphql}

### Altair, or your own tooling

Hub ships an embedded Altair GraphQL client for testing queries interactively, and the same endpoint is fair game for any GraphQL-capable tool or script — including a browser GraphQL inspector extension pointed at Hub while you click around the UI.

- icon:braces **[Tanzu Hub — Altair]($HUB_URL/hub/altair/)** — The embedded GraphQL playground — write and run a query against your own portfolio data directly.

## content: Custom Reports {#reporting-custom-reports}

### A sample to start from, not a blank page

The Custom Reports section of App Portfolio Assessment lets you upload a self-contained HTML report that queries the GraphQL API and renders however you like — useful when a stakeholder needs a view shaped differently than anything built in.

- icon:file-text **sample_custom_report.html** — A minimal working example — GraphQL query, basic parsing, a chart. Start here.
- icon:bar-chart **Playground** — A more ambitious report letting you slice and dice by any combination of challenges, facets, and technical debt to find archetypes of similar apps.

> [!info] Try it in the Playground
> Pick a Repository Group, then narrow by a characteristic like "Write Local Files" or a framework range like "Spring Boot 2.0 to 2.6" — watch the matching repo set shrink as you add criteria. This is the fastest way to find a coherent modernization wave.

## content: Closing the loop with custom rules {#reporting-custom-rules-recap}

### If a report reveals a gap, a rule can fill it

Custom Reports are often how you *discover* that a custom rule is worth writing — you notice a pattern across several apps that none of the built-in rules capture, then encode it as a new rule scoped to the relevant Repository Group so it shows up automatically in every future assessment.

> [!info] What's not there yet
> Custom tagging beyond pattern-matched rules — and saving/loading/comparing archetypes directly in the Playground — are both roadmap items, not available today. The pattern-matching case (a regex against source or dependency files) is fully supported now.

## discussion: Who in your org needs a custom view? {#reporting-discussion}

A portfolio owner, a security team, and a platform team all want different slices of the same assessment data. Who would you build a custom report for first, and what would it show that the built-in dashboards don't?

- Security teams often want a single view of every Blocker-severity challenge across the whole org, cutting across Repository Groups entirely
- A portfolio owner usually wants business criticality crossed with suitability — exactly the Summary page's core chart, but scoped to their business app
- Anything queryable via GraphQL is fair game for a custom report — the built-in views are a starting point, not a ceiling
