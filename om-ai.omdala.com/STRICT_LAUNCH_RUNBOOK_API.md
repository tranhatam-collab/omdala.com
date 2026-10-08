# Strict Launch Runbook (API)

Use this runbook to unblock strict app launch gates.

## Required production endpoints

1. `GET /v2/reality/scenes`
2. `GET /v2/reality/runs?page=1&limit=10`

These two endpoints must return HTTP 200 on `https://api.omdala.com` for strict mode to pass.

## Expected response shape

All responses should follow envelope shape:

```json
{
  "data": {},
  "error": null,
  "meta": {
    "requestId": "..."
  }
}
```

### Scenes example

```json
{
  "data": {
    "scenes": [
      {
        "scene_id": "scene_sleep",
        "display_name": "Sleep mode",
        "safety_class": "low"
      }
    ]
  },
  "error": null,
  "meta": {
    "requestId": "req_123"
  }
}
```

### Runs example

```json
{
  "data": {
    "runs": [
      {
        "run_id": "run_123",
        "source": "scene",
        "source_id": "scene_sleep",
        "actor_id": "user_demo_01",
        "status": "succeeded",
        "proof_id": "proof_123",
        "created_at": "2026-04-05T14:00:00Z"
      }
    ]
  },
  "error": null,
  "meta": {
    "requestId": "req_124"
  }
}
```

## Verification commands

```bash
curl -i "https://api.omdala.com/v2/reality/scenes"
curl -i "https://api.omdala.com/v2/reality/runs?page=1&limit=10"
```

## Strict gate command

```bash
npm run e2e:app:mvp:strict
```

If strict fails, use the endpoint diagnostics printed by the script body output.

## Precheck and status snapshot

```bash
npm run api:strict:precheck
npm run api:strict:status
```

The second command writes `API_STRICT_BLOCKER_STATUS.md` with the current blocker states.

## Team handoff report

```bash
npm run api:strict:report
```

This writes `API_TEAM_STRICT_REPORT.md` for direct handoff to API team.

## Auto-watch strict gate

```bash
INTERVAL_SECONDS=60 MAX_ATTEMPTS=30 npm run api:strict:watch
```

This retries strict gate until pass or timeout.
