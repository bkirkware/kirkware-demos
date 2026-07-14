import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor'

export const introSteps: DemoStep[] = [
  {
    id: 'intro-title',
    type: 'title',
    section: 'Introduction',
    title: 'Welcome',
    eyebrow: 'VMware Tanzu Spring · Application Advisor 1.6',
    heading: 'Application Advisor',
    subheading:
      'Continuously and incrementally upgrade Spring dependencies across every Git repository you own — without a fleet of engineers hand-rolling version bumps one repo at a time.',
    bullets: ['Automated Upgrades', 'Cross-Repo Safety', 'Best-Practice Advice', 'Air-Gapped Ready'],
  },
  {
    id: 'intro-why',
    type: 'content',
    section: 'Introduction',
    title: 'Four core operations',
    heading: 'What Application Advisor actually does',
    body: 'Application Advisor is an upgrade **orchestrator**, not just a dependency bot — it prevents stale or invalid pull requests caused by dependency conflicts across your whole fleet of repos. Under the hood it runs four operations.',
    bullets: [
      { title: 'Dependency Analysis', icon: 'database', description: 'Generates a CycloneDX dependency tree, JDK version, and build tool version for a repo — the "build config" / SBOM.' },
      { title: 'Upgrade Planning', icon: 'layers', description: 'Computes which Spring dependencies and tools must move together to reach the next compatible release, broken into ordered steps.' },
      { title: 'Code Refactoring', icon: 'sparkles', description: 'Applies dependency version bumps and Java API rewrites using OpenRewrite recipes — as of 1.6, embedded directly in the CLI binary for air-gapped use.' },
      { title: 'Pull Request Creation', icon: 'git-branch', description: 'In CI/CD mode, automatically opens a PR with the refactored changes instead of just editing the working tree.' },
    ],
    callout: {
      label: 'Two CLIs, one product',
      tone: 'info',
      body: 'Tanzu Spring Enterprise customers run the standalone `advisor` CLI. Tanzu Platform customers run the same capability as `cf repo` commands via the `repo` plug-in. The commands are equivalent for most upgrade and analysis workflows — this demo uses the `cf repo` form throughout.',
    },
    sourceUrl: `${DOCS}/what-is-app-advisor.html`,
  },
  {
    id: 'intro-discussion',
    type: 'discussion',
    section: 'Introduction',
    title: 'Where does upgrade pain live today?',
    prompt: 'Think about your oldest production Spring app — what actually stops it from being upgraded?',
    talkingPoints: [
      'Nobody wants to spend a sprint hand-editing pom.xml/build.gradle across dozens of repos for one version bump',
      'The javax → jakarta migration alone (Spring Boot 2.7 → 3.0) touches imports across the whole codebase — exactly the kind of mechanical change a recipe engine should own',
      'Shared internal libraries create a "who moves first" deadlock: nobody upgrades because nobody else has, until Application Advisor computes the safe order for you',
    ],
  },
]
