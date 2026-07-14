import type { DemoStep } from '@/types/demo'

const SECTION = 'Deploy the Target App'

export const deployTargetSteps: DemoStep[] = [
  {
    id: 'deploy-target-intro',
    type: 'content',
    section: SECTION,
    title: 'A real app for the agent to work against',
    heading: 'A forked Spring PetClinic, deployed to its own space',
    body: 'The agent needs a real GitHub issue on a real repo to close. This is a plain, ordinary `cf push` — the only thing worth noticing is the space switch: petclinic lives away from coding-agents so the agent\'s own space is never the one it can push changes into by accident.',
  },
  {
    id: 'deploy-target-space',
    type: 'command',
    section: SECTION,
    title: 'Switch spaces',
    heading: 'Target petclinic before touching the target app',
    commands: [
      {
        label: 'set-space-petclinic.sh',
        lang: 'bash',
        code: `export CF_SPACE=petclinic
echo $CF_SPACE`,
        liveId: 'set-cf-space-petclinic.sh',
      },
      {
        label: 'target.sh',
        lang: 'bash',
        code: `cf target -o "$CF_ORG" -s "$CF_SPACE"`,
        liveId: 'cf-target.sh',
      },
    ],
  },
  {
    id: 'deploy-target-clone',
    type: 'command',
    section: SECTION,
    title: 'Clone and build',
    heading: 'A fork the agent is allowed to open PRs against',
    commands: [
      {
        label: 'clone.sh',
        lang: 'bash',
        code: `cd ~/work/git/kirkware/kirkware-lab/dev
gh repo clone bkirkware/spring-petclinic
cd spring-petclinic`,
      },
      {
        label: 'package.sh',
        lang: 'bash',
        code: `mvn clean package`,
      },
    ],
  },
  {
    id: 'deploy-target-push',
    type: 'command',
    section: SECTION,
    title: 'Push the baseline',
    heading: 'A running app, before the agent ever touches it',
    commands: [
      {
        label: 'manifest.sh',
        lang: 'bash',
        code: `cat > manifest.yml <<'EOF'
applications:
- name: spring-petclinic
  memory: 1024M
  instances: 1
  path: target/spring-petclinic-4.0.0-SNAPSHOT.jar
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
  },
]
