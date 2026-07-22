---
section: Deploy the Target App
---

## content: A real app for the agent to work against {#deploy-target-intro}

### A forked Spring PetClinic, deployed to its own space

The agent needs a real GitHub issue on a real repo to close. This is a plain, ordinary `cf push` — the only thing worth noticing is the space switch: petclinic lives away from coding-agents so the agent's own space is never the one it can push changes into by accident.

## command: Switch spaces {#deploy-target-space}

### Target petclinic before touching the target app

```bash label=set-space-petclinic.sh live=set-cf-space-petclinic.sh
export CF_SPACE=petclinic
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

## command: Clone and build {#deploy-target-clone}

### A fork the agent is allowed to open PRs against

```bash label=clone.sh
cd ~/work/git/kirkware/kirkware-lab/dev
gh repo clone bkirkware/spring-petclinic
cd spring-petclinic
```

```bash label=package.sh
mvn clean package
```

## command: Push the baseline {#deploy-target-push}

### A running app, before the agent ever touches it

```bash label=manifest.sh
cat > manifest.yml <<'EOF'
applications:
- name: spring-petclinic
  memory: 1024M
  instances: 1
  path: target/spring-petclinic-4.0.0-SNAPSHOT.jar
  buildpacks:
  - java_buildpack_offline
  routes:
  - route: petclinic.apps.tanzu.kirkware.net
EOF
```

```bash label=push.sh
cf push
```
