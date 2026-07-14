import type { DemoStep } from '@/types/demo'

const SECTION = 'Lab Preparation'

export const labPrepSteps: DemoStep[] = [
  {
    id: 'labprep-precheck',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks',
    heading: 'Target this lab\'s space, then verify the toolchain',
    description: 'Every script below is independent and safe to re-run. The first one sets `CF_SPACE` to this lab\'s value and saves it straight to `.env` — it shows up immediately in Settings and in every variable-hover preview across the app, not just later commands in this session.',
    commands: [
      {
        label: 'set-space.sh',
        lang: 'bash',
        code: `export CF_SPACE=kwd-app-advisor
echo $CF_SPACE`,
        liveId: 'set-cf-space-app-advisor.sh',
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
  },
  {
    id: 'labprep-cleanup',
    type: 'command',
    section: SECTION,
    title: 'Cleanup',
    heading: 'Tear down the demo app',
    commands: [
      {
        label: 'set-space.sh',
        lang: 'bash',
        code: `export CF_SPACE=kwd-app-advisor
echo $CF_SPACE`,
        liveId: 'set-cf-space-app-advisor.sh',
      },
      {
        label: 'target.sh',
        lang: 'bash',
        code: `cf target -o "$CF_ORG" -s "$CF_SPACE"`,
        liveId: 'cf-target.sh',
      },
      {
        label: 'cleanup.sh',
        lang: 'bash',
        code: `cf delete spring-petclinic -r -f`,
      },
    ],
  },
]
