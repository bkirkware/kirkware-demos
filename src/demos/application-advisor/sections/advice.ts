import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor'
const SECTION = 'Governance & Best Practices'

export const adviceSteps: DemoStep[] = [
  {
    id: 'advice-intro',
    type: 'content',
    section: SECTION,
    title: 'Advice beyond version numbers',
    heading: '`cf repo advice` — recommendations, not just upgrades',
    body: 'Advice is a separate track from the upgrade plan: recommendations for Spring Enterprise extensions and build-tool changes that align an app with best practice, independent of whether a version bump is on the table.',
    bullets: [
      { title: 'advice', icon: 'shield-check', description: 'Prints applicable recommendations for this repo — triggers a fresh Tanzu Hub assessment automatically if the repo is newer than the last one on file.' },
      { title: 'apply-advice --name', icon: 'sparkles', description: 'Applies one recommendation by name, e.g. `spring-aot`, `spring-governance-starter`, or `jakarta-jax-rs`.' },
    ],
    callout: {
      label: 'Jakarta JAX-RS migration',
      tone: 'info',
      body: 'For apps still on Jakarta JAX-RS, advice can recommend migrating to Spring Boot 3.x — dynamically targeted at whatever Spring Boot version the project is already on. This particular advice is Tanzu cf CLI only; it has no standalone `advisor` CLI equivalent.',
    },
    sourceUrl: `${DOCS}/recommendations.html`,
  },
  {
    id: 'advice-mappings',
    type: 'content',
    section: SECTION,
    title: 'Internal shared libraries',
    heading: 'Custom upgrade mappings break the "who moves first" deadlock',
    body: "By default, Application Advisor won't upgrade an app past what its internal shared libraries/custom starters support — otherwise you'd get incompatible Spring versions on the classpath. A custom mapping tells it what those internal artifacts actually support.",
    bullets: [
      { title: 'File system', icon: 'file-text', description: 'A local JSON mapping file, referenced via `SPRING_ADVISOR_MAPPING_CUSTOM_0_FILEPATH`.' },
      { title: 'Git repository', icon: 'git-branch', description: 'Mappings hosted in a Git repo via `SPRING_ADVISOR_MAPPING_CUSTOM_0_GIT_URI` — the shared-library team owns the file, everyone else just points at it.' },
      { title: 'JFrog Artifactory', icon: 'boxes', description: 'Centralized via `SPRING_ADVISOR_MAPPING_CUSTOM_0_ARTIFACTORY_*` variables — one source of truth for a whole org.' },
    ],
    callout: {
      label: 'Generate, don\'t hand-write',
      tone: 'success',
      body: '`cf repo create-mapping` inspects your local Maven repository and generates the mapping automatically. Pair it with `SPRING_ADVISOR_MAPPING_CUSTOM_0_MERGE_STRATEGY=override` to layer your org\'s mapping on top of the built-in ones instead of replacing them wholesale.',
    },
    sourceUrl: `${DOCS}/custom-upgrades.html`,
  },
]
