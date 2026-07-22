---
section: Lab Preparation
---

## command: Pre-checks {#labprep-precheck}

### Target this lab's space, then verify the toolchain

Every script below is independent and safe to re-run. The first one sets `CF_SPACE` to this lab's value and saves it straight to `.env` — it shows up immediately in Settings and in every variable-hover preview across the app.

```bash label=set-space.sh live=set-cf-space-app-assessment.sh
export CF_SPACE=kwd-app-assessment
echo $CF_SPACE
```

```bash label=login.sh live=cf-login.sh
cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG" < /dev/null
```

```bash label=ensure-space.sh live=cf-ensure-space.sh
cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```bash label=verify-jdks.sh live=sdk-list-java.sh
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk list java
```

> [!impact]
> The onboarding walkthrough later in this demo builds a real Maven project — having the right JDK on hand now saves a context switch mid-demo.

## command: Pre-checks: confirm a clean space {#labprep-clean-check}

### Nothing left over from a previous run

This space should have no apps yet — the onboarding walkthrough pushes exactly one.

```bash label=apps.sh live=cf-apps.sh
cf apps
```

> [!impact]
> If it lists anything, run the Cleanup step below first, then come back here.

## command: Cleanup {#labprep-cleanup}

### Tear down the onboarded demo app

```bash label=set-space.sh live=set-cf-space-app-assessment.sh
export CF_SPACE=kwd-app-assessment
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```bash label=delete-app.sh
cf delete tp-demo -r -f
```

```bash label=clean-tanzu-dir.sh
cd "$TEMP_WORKSPACE/tp-demo" 2>/dev/null && rm -rf .tanzu .advisor
```

> [!impact]
> This leaves the cloned `tp-demo` repository itself in place under `$TEMP_WORKSPACE` — only the onboarding artifacts and the pushed app are removed, so re-running the demo starts from "assessed but not yet onboarded" rather than a fresh clone.
