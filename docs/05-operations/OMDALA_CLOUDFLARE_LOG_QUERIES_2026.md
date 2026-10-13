# OMDALA Cloudflare Logs Queries (2026)

Use these queries in Cloudflare Logs to monitor `/v2/reality/*` request quality and DB failures.

## 1) Latest v2 errors by error_code

```
message = "v2/reality handler error" OR message = "v2/reality db error"
| filter path starts_with "/v2/reality/"
| fields timestamp, request_id, method, path, error_code, sql_state, kind, operation, duration_ms, message
| sort timestamp desc
| limit 200
```

## 2) Error volume by route + error_code (last 1h)

```
message = "v2/reality handler error" OR message = "v2/reality db error"
| filter timestamp >= now() - 1h
| filter path starts_with "/v2/reality/"
| stats count() as error_count by path, error_code
| sort error_count desc
```

## 3) p95 duration by route (success + errors)

```
message = "v2_request"
| filter route starts_with "/v2/reality/"
| stats
    count() as total_requests,
    avg(duration_ms) as avg_ms,
    percentile(duration_ms, 95) as p95_ms,
    max(duration_ms) as max_ms
  by route, method
| sort p95_ms desc
```

## 4) Slow requests only (p95 outliers)

```
message = "v2_request"
| filter route starts_with "/v2/reality/"
| filter duration_ms >= 1000
| fields timestamp, request_id, method, route, status, duration_ms
| sort duration_ms desc
| limit 200
```

## 5) Trace one request end-to-end using request_id

```
request_id = "<paste-request-id>"
| fields timestamp, message, method, route, path, status, error_code, sql_state, kind, operation, duration_ms
| sort timestamp asc
```

## 6) DB timeout/unavailable trend (last 24h)

```
message = "v2/reality handler error" OR message = "v2/reality db error"
| filter timestamp >= now() - 24h
| filter error_code in ["DATABASE_TIMEOUT", "DATABASE_UNAVAILABLE"]
| stats count() as total by bin(timestamp, 15m), error_code
| sort timestamp asc
```

## Alert suggestions

- `DATABASE_TIMEOUT` > 20 events / 15m.
- `DATABASE_UNAVAILABLE` > 5 events / 5m.
- Any route p95 `duration_ms` > 1200ms for 3 consecutive windows.
