import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor'
const SECTION = 'Live Upgrade Walkthrough'

export const liveUpgradeSteps: DemoStep[] = [
  {
    id: 'live-intro',
    type: 'content',
    section: SECTION,
    title: 'Spring PetClinic, start to finish',
    heading: 'One real app, Spring Boot 2.7 on Java 8 → Spring Boot 4.0 on Java 17',
    body: 'From here on, every step is a real command against a real checked-out repo — Spring PetClinic pinned at an old commit. Each upgrade step follows the same rhythm: **generate the plan, apply it, review the diff, test, commit.** Nothing here is simulated output.',
    callout: {
      label: 'Prerequisites',
      tone: 'info',
      body: 'Run Lab Preparation → Pre-checks first to target this lab\'s space and verify Java 11/17 are on hand. Separately, make sure a Spring Enterprise Maven token is refreshed in `~/.m2/settings.xml` — [generate one here](https://support.broadcom.com/group/ecx/registry-token) if it has expired.',
    },
    sourceUrl: `${DOCS}/how-to-guides-upgrade-boot.html`,
  },
  {
    id: 'live-get-app',
    type: 'command',
    section: SECTION,
    title: 'Get the app',
    heading: 'Check out Spring Boot 2.7 on Java 8, and push it as-is',
    description: 'Pin PetClinic to a real pre-upgrade commit, push it once so there\'s a running baseline, then let Application Advisor take over from here.',
    commands: [
      {
        label: 'checkout.sh',
        lang: 'bash',
        code: `cd ~/work/git/kirkware/kirkware-lab/dev/spring-petclinic
git branch advisor-demo 9ecdc1111e3da388a750ace41a125287d9620534
git checkout -f advisor-demo`,
      },
      {
        label: 'package.sh',
        lang: 'bash',
        code: `mvn clean package`,
      },
      {
        label: 'manifest.sh',
        lang: 'bash',
        code: `cat > manifest.yml <<'EOF'
applications:
- name: spring-petclinic
  memory: 1024M
  instances: 1
  path: target/spring-petclinic-2.7.3.jar
  buildpacks:
  - java_buildpack_offline
  routes:
  - route: petclinic.apps.tanzu.kirkware.net
EOF`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push`,
      },
    ],
    sourceUrl: `${DOCS}/how-to-guides-upgrade-boot.html`,
  },
  {
    id: 'live-step1-plan',
    type: 'command',
    section: SECTION,
    title: 'Step 1 — plan the Java 11 move',
    heading: 'Build the SBOM, print the plan, apply the first step',
    description: '`build-sbom` resolves the dependency tree into `.advisor/build-config.json`; `upgrade-plan` reads it back as an ordered list of steps. For PetClinic that plan runs eight steps deep — this applies just the first one.',
    commands: [
      {
        label: 'build-sbom.sh',
        lang: 'bash',
        code: `cf repo build-sbom`,
      },
      {
        label: 'upgrade-plan.sh',
        lang: 'bash',
        code: `cf repo upgrade-plan`,
      },
      {
        label: 'apply-upgrade-plan.sh',
        lang: 'bash',
        code: `cf repo apply-upgrade-plan`,
      },
      {
        label: 'diff.sh',
        lang: 'bash',
        code: `git diff`,
      },
    ],
    impact: 'Only `pom.xml` changes at this step — the Java language level moves from 8 to 11, and the JaCoCo plugin version bumps along with it. No application code was touched.',
    sourceUrl: `${DOCS}/upgrade-spring-app.html`,
  },
  {
    id: 'live-step1-test',
    type: 'command',
    section: SECTION,
    title: 'Test & commit — Java 11',
    heading: 'Prove it still works, then lock the step in with a commit',
    commands: [
      {
        label: 'sdk-use.sh',
        lang: 'bash',
        code: `sdk use java 11.0.31-tem`,
      },
      {
        label: 'test.sh',
        lang: 'bash',
        code: `./mvnw test`,
      },
      {
        label: 'package.sh',
        lang: 'bash',
        code: `mvn clean package`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push`,
      },
      {
        label: 'commit.sh',
        lang: 'bash',
        code: `git add .
git commit -m "Upgrade java from 8 to 11"`,
      },
    ],
    sourceUrl: `${DOCS}/how-to-guides-upgrade-boot.html`,
  },
  {
    id: 'live-step2-plan',
    type: 'command',
    section: SECTION,
    title: 'Step 2 — plan the Java 17 move',
    heading: 'Regenerate the SBOM, apply the second step',
    description: 'The build config has to be regenerated after every applied step — the dependency tree just changed. This step\'s recipe touches the Maven Checkstyle plugin to account for Java 17\'s text blocks.',
    commands: [
      {
        label: 'build-sbom.sh',
        lang: 'bash',
        code: `cf repo build-sbom`,
      },
      {
        label: 'apply-upgrade-plan.sh',
        lang: 'bash',
        code: `cf repo apply-upgrade-plan`,
      },
      {
        label: 'diff.sh',
        lang: 'bash',
        code: `git diff`,
      },
    ],
    sourceUrl: `${DOCS}/upgrade-spring-app.html`,
  },
  {
    id: 'live-step2-test',
    type: 'command',
    section: SECTION,
    title: 'Test & commit — Java 17',
    heading: 'Same rhythm, next JDK',
    commands: [
      {
        label: 'sdk-use.sh',
        lang: 'bash',
        code: `sdk use java 17.0.19-tem`,
      },
      {
        label: 'test.sh',
        lang: 'bash',
        code: `./mvnw test`,
      },
      {
        label: 'package.sh',
        lang: 'bash',
        code: `mvn clean package`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push`,
      },
      {
        label: 'commit.sh',
        lang: 'bash',
        code: `git add .
git commit -m "Upgrade java from 11 to 17"`,
      },
    ],
    sourceUrl: `${DOCS}/how-to-guides-upgrade-boot.html`,
  },
  {
    id: 'live-squash-plan',
    type: 'command',
    section: SECTION,
    title: 'Squash the rest — Boot 2.7 → 4.0',
    heading: '`--squash 7` collapses the remaining steps into one diff',
    description: 'The remaining six steps carry Spring Boot from 2.7 through 3.0, 3.1, ... to 4.0. Applying them one at a time is the safest path in production; `--squash 7` is the live-demo shortcut that collapses all seven remaining steps into a single diff.',
    commands: [
      {
        label: 'build-sbom.sh',
        lang: 'bash',
        code: `cf repo build-sbom`,
      },
      {
        label: 'apply-upgrade-plan.sh',
        lang: 'bash',
        code: `cf repo apply-upgrade-plan --squash 7`,
      },
      {
        label: 'diff.sh',
        lang: 'bash',
        code: `git diff`,
      },
    ],
    impact: 'The Spring Boot 3.0 jump inside this squash is the biggest single change in the whole walkthrough: every `javax.*` import becomes `jakarta.*`, and request-mapping annotations pick up the trailing-slash variant Spring Framework 6 needs (`@GetMapping("/owners/new")` → `@GetMapping({"/owners/new", "/owners/new/"})`) — all rewritten automatically, across every touched file.',
    sourceUrl: `${DOCS}/upgrade-spring-app.html`,
  },
  {
    id: 'live-squash-test',
    type: 'command',
    section: SECTION,
    title: 'Test & commit — Spring Boot 4.0.7',
    heading: 'Format, build, push, commit',
    description: 'One extra step here: `spring-javaformat:apply` cleans up formatting on the large squashed diff before it lands.',
    commands: [
      {
        label: 'sdk-use.sh',
        lang: 'bash',
        code: `sdk use java 17.0.19-tem`,
      },
      {
        label: 'test.sh',
        lang: 'bash',
        code: `./mvnw test`,
      },
      {
        label: 'format.sh',
        lang: 'bash',
        code: `mvn spring-javaformat:apply`,
      },
      {
        label: 'package.sh',
        lang: 'bash',
        code: `mvn clean package`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push`,
      },
      {
        label: 'commit.sh',
        lang: 'bash',
        code: `git add .
git commit -m "Upgrade spring boot to 4.0.7"`,
      },
    ],
    sourceUrl: `${DOCS}/how-to-guides-upgrade-boot.html`,
  },
  {
    id: 'live-advice',
    type: 'command',
    section: SECTION,
    title: 'Apply best-practice advice',
    heading: 'Beyond versions: spring-aot and spring-governance-starter',
    description: 'Version numbers are only half the story. `apply-advice` layers in Spring Enterprise extensions Application Advisor recommends for this app — no separate upgrade plan needed.',
    commands: [
      {
        label: 'apply-advice-aot.sh',
        lang: 'bash',
        code: `cf repo apply-advice -n spring-aot`,
      },
      {
        label: 'apply-advice-governance.sh',
        lang: 'bash',
        code: `cf repo apply-advice -n spring-governance-starter`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push`,
      },
      {
        label: 'git-add.sh',
        lang: 'bash',
        code: `git add .`,
      },
      {
        label: 'git-commit.sh',
        lang: 'bash',
        code: `git commit -m "Spring Governance Starter"`,
      },
    ],
    impact: 'PetClinic now builds with AOT processing and reports into your org\'s governance/observability baseline — both added by the same tool that just carried it from Java 8 to 17 and Spring Boot 2.7 to 4.0.',
    sourceUrl: `${DOCS}/recommendations.html`,
  },
  {
    id: 'live-question',
    type: 'question',
    section: SECTION,
    title: 'What would you automate first?',
    prompt: 'Eight upgrade steps, two JDK swaps, and a javax → jakarta rewrite — all reviewed as plain `git diff`s. Which part of this would save your team the most time if it ran unattended in CI?',
    hints: [
      '`--push --from-yml` skips the local loop entirely and opens the PR for you — good for low-risk, frequently-upgraded repos',
      'Keeping the step-by-step (non-squashed) path for anything customer-facing gives reviewers a diff-sized-to-review unit of change',
      '`apply-advice` runs independently of `apply-upgrade-plan` — governance rollouts don\'t have to wait for a version bump',
    ],
  },
]
