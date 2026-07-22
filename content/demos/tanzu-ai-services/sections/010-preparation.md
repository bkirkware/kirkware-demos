---
section: Preparation
---

## content: Prerequisites {#prep-prereqs}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/index.html
links:
  - label: Release Notes
    url: https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai/release-notes.html
---

### Before the audience arrives

One foundation, one CLI, one tile. Verify each before you present.

- icon:tanzu **AI Services tile installed** — v10.4.x on Tanzu Operations Manager v3.0.28+, EART 10.2–10.4
- icon:terminal **CF CLI v8+ logged in** — with an org and space reserved for this demo
- icon:key **.env filled in** — CF_API_URL, CF_USERNAME, CF_PASSWORD, CF_ORG, CF_SPACE via Settings

## command: Check the environment {#prep-env-check}

### Confirm the .env is loaded

Every Run Live block sources this file — an empty value here fails later, mid-demo.

```bash label=env-check.sh live=env-check.sh
cat .env
```

```output
CF_API_URL=https://api.sys.tanzu.kirkware.net
CF_USERNAME=admin
CF_ORG=kirkware
CF_SPACE=ai-services
```

## command: Log in & target {#prep-cf-target}

### Point the CLI at the demo org

Log in once, then pin the org and space so every later command lands where the audience expects.

```bash label=cf-login.sh live=cf-login.sh
cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG"
```

```bash label=cf-target.sh live=cf-target.sh
cf target -o "$CF_ORG" -s "$CF_SPACE"
```

```output
API endpoint:   https://api.sys.tanzu.kirkware.net
API version:    3.195.0
user:           admin
org:            kirkware
space:          ai-services
```

> [!impact]
> The stage is set: from here, everything the audience sees is the same `cf` workflow their developers already use.
