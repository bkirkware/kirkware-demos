---
section: Cleanup
---

## command: Tear down {#cleanup}

### Return the environment to pre-demo state

Delete anything the demo created so the next run starts clean.

```bash label=cleanup.sh
cf delete-service my-demo-service -f --wait
```

> [!impact]
> The environment is reset — the next audience starts from a clean slate.
