---
section: Lab Preparation
---

## command: Pre-checks {#labprep-precheck}

### Target this lab's space, then verify the toolchain

Every script below is independent and safe to re-run. The first one sets `CF_SPACE` to this lab's value and saves it straight to `.env` — it shows up immediately in Settings and in every variable-hover preview across the app, not just later commands in this session.

```bash label=set-space.sh live=set-cf-space-app-advisor.sh
export CF_SPACE=kwd-app-advisor
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

## command: Cleanup {#labprep-cleanup}

### Tear down the demo app

```bash label=set-space.sh live=set-cf-space-app-advisor.sh
export CF_SPACE=kwd-app-advisor
echo $CF_SPACE
```

```bash label=target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```bash label=cleanup.sh
cf delete spring-petclinic -r -f
```
