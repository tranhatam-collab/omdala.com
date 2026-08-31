# CF Secrets Store Migration — OMDALA
## Status: SCRIPT READY (awaiting live CF credentials)

---

## Migration Script
`scripts/cf-secrets-migrate.sh` performs:

1. Reads `.env` file line by line
2. Skips non-sensitive keys: `NODE_ENV`, `PORT`, `NEXT_PUBLIC_*`
3. Uploads each secret to CF Workers Secrets via REST API
4. Reports success/failure per key

## Prerequisites
```bash
export CLOUDFLARE_ACCOUNT_ID="<account_id>"
export CLOUDFLARE_API_TOKEN="<token_with_Workers_Secrets_edit>"
```

## Usage
```bash
# Migrate all secrets for omdala-api worker
./scripts/cf-secrets-migrate.sh omdala-api
```

## Post-Migration Verification
```bash
# List secrets
wrangler secret list

# Or via API
curl -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/omdala-api/secrets" \
  -H "Authorization: Bearer $API_TOKEN"
```

## Security Notes
- Script skips `NEXT_PUBLIC_*` (browser-exposed)
- Uses `secret_text` type (encrypted at rest)
- Requires token with `Workers Scripts:Edit` permission

## Gate Blocker
- **Weight**: 10/100
- **Cannot complete without**: CF account with Workers Secrets enabled
- **Action needed**: User provides `CLOUDFLARE_API_TOKEN` with correct scope
