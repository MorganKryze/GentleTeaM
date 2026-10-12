# Data guideline

> When to read: data reviewer always; architect when a spec touches storage, sync, a migration or
> anything that writes a person's records.

## Rules
- No write lost, duplicated or silently altered: offline, reload, two tabs, two devices, a lost
  response, midnight and week boundaries.
- Writes that must be atomic share one transaction.
- Queued work drains and replays idempotently.
- An upgrade keeps every stored value and every queued item.
- A stale copy never overwrites a newer one.
- <Project rule: conflict policy, retention, export.>
