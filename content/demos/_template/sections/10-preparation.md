---
section: Preparation
---

<!--
Pre-demo steps: clone repos into temp folders, set the cf org/space,
pre-provision service instances. HTML comments like this one are author
notes — they never render.
-->

## title: Welcome {#welcome}
---
eyebrow: Company · Product · Version
---

### My New Demo

One or two sentences on the promise of the next thirty minutes.

- Key point one
- Key point two

## command: Check the environment {#prep-env}

### Confirm the .env is loaded

`live=` wires a block to an allowlisted dev-server command (run-live-commands.ts).

```bash label=env-check.sh live=env-check.sh
cat .env
```

```output
CF_ORG=kirkware
CF_SPACE=dev
```
