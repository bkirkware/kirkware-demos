import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor'

export const wrapupSteps: DemoStep[] = [
  {
    id: 'wrap-recap',
    type: 'content',
    section: 'Wrap-up',
    title: 'Recap',
    heading: 'What just carried PetClinic from Java 8 to 17, Boot 2.7 to 4.0',
    body: 'One tool, four operations, and a rhythm you can repeat on every repo you own: build the SBOM, generate the plan, apply a step, review, test, commit.',
    bullets: [
      { title: 'Air-gapped by default', icon: 'shield-check', description: '1.6 embeds commercial OpenRewrite recipes in the CLI binary — no external Maven repo access required for the default flow.' },
      { title: 'Incremental by design', icon: 'layers', description: 'Every upgrade is a step you can stop after, test, and commit — or squash together when you trust the diff.' },
      { title: 'javax → jakarta, automated', icon: 'sparkles', description: 'The single largest mechanical migration in a Spring Boot upgrade is exactly the kind of change a recipe engine should own, not a human.' },
      { title: 'Cross-repo safe', icon: 'git-branch', description: 'Custom mappings for internal shared libraries prevent the "who upgrades first" deadlock across a whole org\'s repos.' },
    ],
    callout: {
      label: 'Support boundary, stated plainly',
      tone: 'info',
      body: 'Broadcom supports Application Advisor\'s upgrade and advice tooling itself. Validating that your application still behaves correctly after an upgrade — the actual test suite, the actual code review — is still on you.',
    },
    sourceUrl: `${DOCS}/what-is-app-advisor.html`,
  },
  {
    id: 'wrap-closing',
    type: 'title',
    section: 'Wrap-up',
    title: 'Closing',
    eyebrow: 'Discussion',
    heading: 'Questions?',
    subheading: "What's the oldest Spring Boot app in your fleet, and what would it take to point Application Advisor at it tomorrow?",
  },
]
