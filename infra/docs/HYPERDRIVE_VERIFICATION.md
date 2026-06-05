# Hyperdrive Schema Verification — OMDALA
## Status: SCRIPT READY (awaiting CF Dashboard activation)

---

## Verification Script
`scripts/verify-hyperdrive.sh` checks:

1. **Config fetch** from CF API
2. **Origin settings**: host, port (expected: 5432), database name
3. **Caching settings**: disabled=false, max_age
4. **Schema validation**: port must be 5432, caching must be enabled

## Expected Schema
```json
{
  "origin": {
    "host": "postgres.omdala.internal",
    "port": 5432,
    "database": "omdala_prod",
    "user": "omdala_app"
  },
  "caching": {
    "disabled": false,
    "max_age": 30
  }
}
```

## Activation Steps (needs CF Dashboard)
1. Create Hyperdrive config in CF Dashboard
2. Note the `HYPERDRIVE_ID`
3. Bind to Worker in `wrangler.toml`:
   ```toml
   [[hyperdrive]]
   binding = "HYPERDRIVE"
   id = "<hyperdrive_id>"
   ```
4. Run: `./scripts/verify-hyperdrive.sh <hyperdrive_id>`

## Gate Blocker
- **Weight**: 15/100
- **Cannot complete without**: CF Dashboard access + live Hyperdrive ID
- **Action needed**: User creates Hyperdrive in CF Dashboard, provides ID

---

## Verification Command
```bash
export CLOUDFLARE_ACCOUNT_ID="<account_id>"
export CLOUDFLARE_API_TOKEN="<token>"
export HYPERDRIVE_ID="<id>"
./scripts/verify-hyperdrive.sh $HYPERDRIVE_ID
```

Expected output on success:
```
=== Hyperdrive Schema Verification ===
[1/3] Fetching Hyperdrive config...
[2/3] Verifying origin settings...
  Host: postgres.omdala.internal
  Port: 5432
  Database: omdala_prod
[3/3] Verifying caching settings...
  Caching disabled: false
  Max age: 30s
=== Hyperdrive Schema VERIFIED ===
```
