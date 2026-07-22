---
section: Governance & Best Practices
---

## content: Advice beyond version numbers {#advice-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/recommendations.html
---

### `cf repo advice` — recommendations, not just upgrades

Advice is a separate track from the upgrade plan: recommendations for Spring Enterprise extensions and build-tool changes that align an app with best practice, independent of whether a version bump is on the table.

- icon:shield-check **advice** — Prints applicable recommendations for this repo — triggers a fresh Tanzu Hub assessment automatically if the repo is newer than the last one on file.
- icon:sparkles **apply-advice --name** — Applies one recommendation by name, e.g. `spring-aot`, `spring-governance-starter`, or `jakarta-jax-rs`.

> [!info] Jakarta JAX-RS migration
> For apps still on Jakarta JAX-RS, advice can recommend migrating to Spring Boot 3.x — dynamically targeted at whatever Spring Boot version the project is already on. This particular advice is Tanzu cf CLI only; it has no standalone `advisor` CLI equivalent.

## content: Internal shared libraries {#advice-mappings}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/custom-upgrades.html
---

### Custom upgrade mappings break the "who moves first" deadlock

By default, Application Advisor won't upgrade an app past what its internal shared libraries/custom starters support — otherwise you'd get incompatible Spring versions on the classpath. A custom mapping tells it what those internal artifacts actually support.

- icon:file-text **File system** — A local JSON mapping file, referenced via `SPRING_ADVISOR_MAPPING_CUSTOM_0_FILEPATH`.
- icon:git-branch **Git repository** — Mappings hosted in a Git repo via `SPRING_ADVISOR_MAPPING_CUSTOM_0_GIT_URI` — the shared-library team owns the file, everyone else just points at it.
- icon:boxes **JFrog Artifactory** — Centralized via `SPRING_ADVISOR_MAPPING_CUSTOM_0_ARTIFACTORY_*` variables — one source of truth for a whole org.

> [!success] Generate, don't hand-write
> `cf repo create-mapping` inspects your local Maven repository and generates the mapping automatically. Pair it with `SPRING_ADVISOR_MAPPING_CUSTOM_0_MERGE_STRATEGY=override` to layer your org's mapping on top of the built-in ones instead of replacing them wholesale.
