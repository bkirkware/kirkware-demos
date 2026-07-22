---
section: Live Upgrade Walkthrough
---

## content: Spring PetClinic, start to finish {#live-intro}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/how-to-guides-upgrade-boot.html
---

### One real app, Spring Boot 2.7 on Java 8 → Spring Boot 4.0 on Java 17

From here on, every step is a real command against a real checked-out repo — Spring PetClinic pinned at an old commit. Each upgrade step follows the same rhythm: **generate the plan, apply it, review the diff, test, commit.** Nothing here is simulated output.

> [!info] Prerequisites
> Run Lab Preparation → Pre-checks first to target this lab's space and verify Java 11/17 are on hand. Separately, make sure a Spring Enterprise Maven token is refreshed in `~/.m2/settings.xml` — [generate one here](https://support.broadcom.com/group/ecx/registry-token) if it has expired.

## command: Get the app {#live-get-app}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/how-to-guides-upgrade-boot.html
---

### Check out Spring Boot 2.7 on Java 8, and push it as-is

Pin PetClinic to a real pre-upgrade commit, push it once so there's a running baseline, then let Application Advisor take over from here.

```bash label=checkout.sh
cd ~/work/git/kirkware/kirkware-lab/dev/spring-petclinic
git branch advisor-demo 9ecdc1111e3da388a750ace41a125287d9620534
git checkout -f advisor-demo
```

```bash label=package.sh
mvn clean package
```

```bash label=manifest.sh
cat > manifest.yml <<'EOF'
applications:
- name: spring-petclinic
  memory: 1024M
  instances: 1
  path: target/spring-petclinic-2.7.3.jar
  buildpacks:
  - java_buildpack_offline
  routes:
  - route: petclinic.apps.tanzu.kirkware.net
EOF
```

```bash label=push.sh
cf push
```

## command: Step 1 — plan the Java 11 move {#live-step1-plan}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### Build the SBOM, print the plan, apply the first step

`build-sbom` resolves the dependency tree into `.advisor/build-config.json`; `upgrade-plan` reads it back as an ordered list of steps. For PetClinic that plan runs eight steps deep — this applies just the first one.

```bash label=build-sbom.sh
cf repo build-sbom
```

```bash label=upgrade-plan.sh
cf repo upgrade-plan
```

```bash label=apply-upgrade-plan.sh
cf repo apply-upgrade-plan
```

```bash label=diff.sh
git diff
```

> [!impact]
> Only `pom.xml` changes at this step — the Java language level moves from 8 to 11, and the JaCoCo plugin version bumps along with it. No application code was touched.

## command: Test & commit — Java 11 {#live-step1-test}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/how-to-guides-upgrade-boot.html
---

### Prove it still works, then lock the step in with a commit

```bash label=sdk-use.sh
sdk use java 11.0.31-tem
```

```bash label=test.sh
./mvnw test
```

```bash label=package.sh
mvn clean package
```

```bash label=push.sh
cf push
```

```bash label=commit.sh
git add .
git commit -m "Upgrade java from 8 to 11"
```

## command: Step 2 — plan the Java 17 move {#live-step2-plan}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### Regenerate the SBOM, apply the second step

The build config has to be regenerated after every applied step — the dependency tree just changed. This step's recipe touches the Maven Checkstyle plugin to account for Java 17's text blocks.

```bash label=build-sbom.sh
cf repo build-sbom
```

```bash label=apply-upgrade-plan.sh
cf repo apply-upgrade-plan
```

```bash label=diff.sh
git diff
```

## command: Test & commit — Java 17 {#live-step2-test}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/how-to-guides-upgrade-boot.html
---

### Same rhythm, next JDK

```bash label=sdk-use.sh
sdk use java 17.0.19-tem
```

```bash label=test.sh
./mvnw test
```

```bash label=package.sh
mvn clean package
```

```bash label=push.sh
cf push
```

```bash label=commit.sh
git add .
git commit -m "Upgrade java from 11 to 17"
```

## command: Squash the rest — Boot 2.7 → 4.0 {#live-squash-plan}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/upgrade-spring-app.html
---

### `--squash 7` collapses the remaining steps into one diff

The remaining six steps carry Spring Boot from 2.7 through 3.0, 3.1, ... to 4.0. Applying them one at a time is the safest path in production; `--squash 7` is the live-demo shortcut that collapses all seven remaining steps into a single diff.

```bash label=build-sbom.sh
cf repo build-sbom
```

```bash label=apply-upgrade-plan.sh
cf repo apply-upgrade-plan --squash 7
```

```bash label=diff.sh
git diff
```

> [!impact]
> The Spring Boot 3.0 jump inside this squash is the biggest single change in the whole walkthrough: every `javax.*` import becomes `jakarta.*`, and request-mapping annotations pick up the trailing-slash variant Spring Framework 6 needs (`@GetMapping("/owners/new")` → `@GetMapping({"/owners/new", "/owners/new/"})`) — all rewritten automatically, across every touched file.

## command: Test & commit — Spring Boot 4.0.7 {#live-squash-test}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/how-to-guides-upgrade-boot.html
---

### Format, build, push, commit

One extra step here: `spring-javaformat:apply` cleans up formatting on the large squashed diff before it lands.

```bash label=sdk-use.sh
sdk use java 17.0.19-tem
```

```bash label=test.sh
./mvnw test
```

```bash label=format.sh
mvn spring-javaformat:apply
```

```bash label=package.sh
mvn clean package
```

```bash label=push.sh
cf push
```

```bash label=commit.sh
git add .
git commit -m "Upgrade spring boot to 4.0.7"
```

## command: Apply best-practice advice {#live-advice}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor/recommendations.html
---

### Beyond versions: spring-aot and spring-governance-starter

Version numbers are only half the story. `apply-advice` layers in Spring Enterprise extensions Application Advisor recommends for this app — no separate upgrade plan needed.

```bash label=apply-advice-aot.sh
cf repo apply-advice -n spring-aot
```

```bash label=apply-advice-governance.sh
cf repo apply-advice -n spring-governance-starter
```

```bash label=push.sh
cf push
```

```bash label=git-add.sh
git add .
```

```bash label=git-commit.sh
git commit -m "Spring Governance Starter"
```

> [!impact]
> PetClinic now builds with AOT processing and reports into your org's governance/observability baseline — both added by the same tool that just carried it from Java 8 to 17 and Spring Boot 2.7 to 4.0.

## question: What would you automate first? {#live-question}

Eight upgrade steps, two JDK swaps, and a javax → jakarta rewrite — all reviewed as plain `git diff`s. Which part of this would save your team the most time if it ran unattended in CI?

- `--push --from-yml` skips the local loop entirely and opens the PR for you — good for low-risk, frequently-upgraded repos
- Keeping the step-by-step (non-squashed) path for anything customer-facing gives reviewers a diff-sized-to-review unit of change
- `apply-advice` runs independently of `apply-upgrade-plan` — governance rollouts don't have to wait for a version bump
