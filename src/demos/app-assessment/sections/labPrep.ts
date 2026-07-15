import type { DemoStep } from '@/types/demo'

const SECTION = 'Lab Preparation'

export const labPrepSteps: DemoStep[] = [
  {
    id: 'labprep-precheck',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks',
    heading: 'Target this lab\'s space, then verify the toolchain',
    description: 'Every script below is independent and safe to re-run. The first one sets `CF_SPACE` to this lab\'s value and saves it straight to `.env` — it shows up immediately in Settings and in every variable-hover preview across the app.',
    commands: [
      {
        label: 'set-space.sh',
        lang: 'bash',
        code: `export CF_SPACE=kwd-app-assessment
echo $CF_SPACE`,
        liveId: 'set-cf-space-app-assessment.sh',
      },
      {
        label: 'login.sh',
        lang: 'bash',
        code: `cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG" < /dev/null`,
        liveId: 'cf-login.sh',
      },
      {
        label: 'ensure-space.sh',
        lang: 'bash',
        code: `cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"`,
        liveId: 'cf-ensure-space.sh',
      },
      {
        label: 'target.sh',
        lang: 'bash',
        code: `cf target -o "$CF_ORG" -s "$CF_SPACE"`,
        liveId: 'cf-target.sh',
      },
      {
        label: 'verify-jdks.sh',
        lang: 'bash',
        code: `source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk list java`,
        liveId: 'sdk-list-java.sh',
      },
    ],
    impact: 'The onboarding walkthrough later in this demo builds a real Maven project — having the right JDK on hand now saves a context switch mid-demo.',
  },
  {
    id: 'labprep-clean-check',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks: confirm a clean space',
    heading: 'Nothing left over from a previous run',
    description: 'This space should have no apps yet — the onboarding walkthrough pushes exactly one.',
    commands: [
      {
        label: 'apps.sh',
        lang: 'bash',
        code: `cf apps`,
        liveId: 'cf-apps.sh',
      },
    ],
    impact: 'If it lists anything, run the Cleanup step below first, then come back here.',
  },
  {
    id: 'labprep-cleanup',
    type: 'command',
    section: SECTION,
    title: 'Cleanup',
    heading: 'Tear down the onboarded demo app',
    commands: [
      {
        label: 'set-space.sh',
        lang: 'bash',
        code: `export CF_SPACE=kwd-app-assessment
echo $CF_SPACE`,
        liveId: 'set-cf-space-app-assessment.sh',
      },
      {
        label: 'target.sh',
        lang: 'bash',
        code: `cf target -o "$CF_ORG" -s "$CF_SPACE"`,
        liveId: 'cf-target.sh',
      },
      {
        label: 'delete-app.sh',
        lang: 'bash',
        code: `cf delete tp-demo -r -f`,
      },
      {
        label: 'clean-tanzu-dir.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE/tp-demo" 2>/dev/null && rm -rf .tanzu .advisor`,
      },
    ],
    impact: 'This leaves the cloned `tp-demo` repository itself in place under `$TEMP_WORKSPACE` — only the onboarding artifacts and the pushed app are removed, so re-running the demo starts from "assessed but not yet onboarded" rather than a fresh clone.',
  },
]
