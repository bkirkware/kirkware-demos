---
section: Wrap-up
---

## content: Recap {#wrap-recap}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/what-is-app-advisor.html
---

### What just carried PetClinic from Java 8 to 17, Boot 2.7 to 4.0

One tool, four operations, and a rhythm you can repeat on every repo you own: build the SBOM, generate the plan, apply a step, review, test, commit.

- icon:shield-check **Air-gapped by default** — 1.6 embeds commercial OpenRewrite recipes in the CLI binary — no external Maven repo access required for the default flow.
- icon:layers **Incremental by design** — Every upgrade is a step you can stop after, test, and commit — or squash together when you trust the diff.
- icon:sparkles **javax → jakarta, automated** — The single largest mechanical migration in a Spring Boot upgrade is exactly the kind of change a recipe engine should own, not a human.
- icon:git-branch **Cross-repo safe** — Custom mappings for internal shared libraries prevent the "who upgrades first" deadlock across a whole org's repos.

> [!info] Support boundary, stated plainly
> Broadcom supports Application Advisor's upgrade and advice tooling itself. Validating that your application still behaves correctly after an upgrade — the actual test suite, the actual code review — is still on you.

## title: Closing {#wrap-closing}
---
eyebrow: Discussion
---

### Questions?

What's the oldest Spring Boot app in your fleet, and what would it take to point Application Advisor at it tomorrow?
