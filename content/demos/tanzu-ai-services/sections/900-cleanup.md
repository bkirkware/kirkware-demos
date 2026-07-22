---
section: Cleanup
---

## command: Tear down {#cleanup-service}

### Remove the demo service instance

Delete the service key first, then the instance — the broker tears down anything it provisioned.

```bash label=delete-key.sh live=cleanup-ai-service-key.sh
cf delete-service-key kirkware-all-models kirkware-all-models -f
```

```bash label=delete-service.sh live=cleanup-ai-service.sh
cf delete-service kirkware-all-models -f --wait
```

```output
Deleting key kirkware-all-models for service instance kirkware-all-models as admin...
OK

Deleting service kirkware-all-models in org kirkware / space ai-services as admin...
OK
```

> [!impact]
> The environment is back to its pre-demo state — the next audience starts from a clean marketplace.
