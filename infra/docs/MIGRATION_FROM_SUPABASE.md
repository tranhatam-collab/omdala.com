# Migration from Supabase / Render to OMDALA Infra (P10)

> **Status:** PLAN — DO NOT EXECUTE WITHOUT FOUNDER APPROVAL  
> **Date:** 2026-06-05  
> **Author:** Chief Infrastructure Architect  
> **Gate:** Must pass P4 (restore test) before executing any migration step.

---

## Principles

1. **Zero downtime.** Always run parallel, never cut over immediately.
2. **Rollback-ready.** Every step must be reversible within 30 minutes.
3. **Data integrity.** Checksum validation at every handoff.
4. **No Supabase decommission until 30-day burn-in.**

---

## Pre-Migration Checklist

- [ ] P4 complete: PostgreSQL running, backup daily, **restore test passes**
- [ ] P8 complete: Keycloak running, OAuth clients registered
- [ ] P5 complete: API Gateway `/health` < 100ms p95
- [ ] P6 complete: Worker queues active, DLQ configured
- [ ] All secrets migrated to Vault (no `.env` in production)
- [ ] Migration runbook reviewed by Founder
- [ ] Rollback script tested on staging

---

## Phase 1: Data Export (Week 1)

### 1.1 Supabase Schema Export
```bash
# Using supabase CLI
supabase db dump --db-url "$SUPABASE_DB_URL" > /tmp/supabase_schema.sql

# Or using pg_dump directly
pg_dump "$SUPABASE_DB_URL" --schema-only > /tmp/supabase_schema.sql
```

### 1.2 Supabase Data Export
```bash
pg_dump "$SUPABASE_DB_URL" --data-only --no-owner --no-privileges \
  | gzip > /tmp/supabase_data_$(date +%Y%m%d).sql.gz
```

### 1.3 Supabase Storage Sync
```bash
# List all buckets
supabase storage ls

# Sync to local, then to R2
rclone sync "supabase:bucket-name" "r2:omdala-prod-user-files/bucket-name" \
  --checksum --progress
```

### 1.4 Render Environment Variables
```bash
# Export all env vars from Render dashboard
render env list --service <service-name> > /tmp/render_env_backup.txt
# Manually map to infra .env format
```

---

## Phase 2: Schema Import & Validation (Week 1–2)

### 2.1 Import Schema to Infra PostgreSQL
```bash
docker exec -i omdala-postgres psql -U omdala_migration -d omdala_prod \
  < /tmp/supabase_schema.sql
```

### 2.2 Apply OMDALA-Specific Migrations
```bash
# Run migration scripts in order
docker exec omdala-postgres psql -U omdala_migration -d omdala_prod \
  -f /migrations/001_omdala_extensions.sql
docker exec omdala-postgres psql -U omdala_migration -d omdala_prod \
  -f /migrations/002_omdala_audit_log.sql
```

### 2.3 Row Count Validation
```bash
# Compare row counts per table
supabase sql -c "SELECT schemaname, tablename, n_tup_ins - n_tup_del as rows FROM pg_stat_user_tables;" > /tmp/supabase_counts.txt

docker exec omdala-postgres psql -U omdala_readonly -d omdala_prod \
  -c "SELECT schemaname, tablename, n_tup_ins - n_tup_del as rows FROM pg_stat_user_tables;" > /tmp/infra_counts.txt

diff /tmp/supabase_counts.txt /tmp/infra_counts.txt
```

### 2.4 Checksum Validation
```bash
# Generate MD5 per table
supabase sql -c "SELECT tablename, MD5(string_agg(ctid::text, ',' ORDER BY ctid)) FROM pg_tables WHERE schemaname='public' GROUP BY tablename;"

# Repeat on infra, compare
```

---

## Phase 3: Parallel Running (Week 2–4)

### 3.1 Read-Only Parallel
- Infra PostgreSQL accepts read-only queries
- Application still writes to Supabase
- Nightly comparison of row counts + checksums
- Alert on any mismatch

### 3.2 Dual-Write (Optional)
- Application writes to BOTH Supabase and Infra
- Infra acts as replica
- Validate consistency every 6 hours
- **Risk:** Latency increase, connection pool pressure. Monitor closely.

### 3.3 Auth Parallel
- Keycloak realm created
- OAuth clients registered for `computer.iai.one` and `maytinhai.org`
- Users can log in via BOTH Supabase Auth and Keycloak
- Session comparison: count active sessions per provider daily

---

## Phase 4: Gradual Cutover (Week 4–6)

### 4.1 Cutover Order (Lowest Risk First)

| # | System | Complexity | Reason |
|---|--------|------------|--------|
| 1 | `computer.iai.one` | Low | Smallest user base, simplest schema |
| 2 | `aiagent.iai.one` | High | Requires agent control plane, run parallel 2 weeks |
| 3 | `maytinhai.org` | Medium | Hybrid: keep CF Workers, switch auth to Keycloak |
| 4 | `tranhatam.com` | Medium | Hybrid: keep CF Workers, switch auth to Keycloak |
| 5 | `aiaccountingloop.com` | High | Multi-worker consolidation, do last |

### 4.2 Cutover Steps per System

```
1. Announce maintenance window (if needed)
2. Set application to read-only mode (if possible)
3. Final data sync: pg_dump → import → validate checksum
4. Switch DATABASE_URL to infra PostgreSQL
5. Switch AUTH provider to Keycloak
6. Restart application
7. Run smoke tests (login, CRUD, file upload, background job)
8. Monitor for 2 hours
9. If all green: remove read-only mode
10. If any issue: switch back to Supabase within 15 minutes
```

---

## Phase 5: Auth Migration (Week 6–7)

### 5.1 User Migration Script
```bash
# Export users from Supabase Auth
supabase auth list > /tmp/supabase_users.json

# Import to Keycloak
# Keycloak does NOT support direct password import (hashed differently)
# Strategy: force password reset email on first login
```

### 5.2 Password Reset Strategy
- All users receive "Welcome to new infrastructure" email
- Link redirects to Keycloak password reset
- Old Supabase sessions invalidated after 7 days
- **Communication:** Email + in-app banner 7 days before cutover

### 5.3 OAuth App Registration
- Register each frontend as OAuth2 client in Keycloak
- Whitelist redirect URIs per environment (prod/staging)
- Test login flow on staging first

---

## Phase 6: Worker / Cron Migration (Week 7–8)

### 6.1 Render Job Inventory
```bash
# List all Render services
render services list > /tmp/render_services.txt

# Identify background workers, cron jobs, scheduled services
# Map each to infra worker queue type:
#   - backup → bullmq queue: backup
#   - email → bullmq queue: email
#   - ai_task → bullmq queue: ai-task
#   - report → bullmq queue: report
```

### 6.2 Worker Deployment
- Deploy worker container with 3 replicas
- Register job handlers in `worker/src/jobs/`
- Gradually move Render cron to GitHub Actions + BullMQ
- Keep Render running in parallel for 2 weeks

---

## Phase 7: Decommission Supabase (Week 9+)

### 7.1 Pre-Decommission Checklist
- [ ] 30 days since last system cutover
- [ ] No application references Supabase URL
- [ ] All data in R2 (no Supabase Storage)
- [ ] All auth via Keycloak (no Supabase Auth)
- [ ] Final backup archived to B2
- [ ] Founder approval signed

### 7.2 Decommission Steps
```bash
# 1. Export final snapshot
pg_dump "$SUPABASE_DB_URL" | gzip > /archive/supabase_final_$(date +%Y%m%d).sql.gz

# 2. Download all Storage buckets
rclone sync "supabase:" "b2:omdala-archive/supabase-storage/"

# 3. Pause Supabase project (do NOT delete yet)
supabase projects pause <project-ref>

# 4. Wait 30 days, then delete if no issues
```

---

## Rollback Procedures

### Rollback Database
```bash
# Within 15 minutes of cutover
# 1. Switch DATABASE_URL back to Supabase
# 2. Restart application
# 3. Verify with smoke tests
```

### Rollback Auth
```bash
# 1. Switch auth provider back to Supabase
# 2. Invalidate Keycloak sessions
# 3. Restore Supabase Auth settings
```

### Full Rollback
```bash
# If everything fails
./scripts/rollback-to-supabase.sh
# This script:
#   - switches all env vars back
#   - restarts all services
#   - runs smoke tests
#   - alerts team
```

---

## Migration Schedule

| Week | Phase | System | Gate |
|------|-------|--------|------|
| 1 | Export | All | Schema + data exported, checksums match |
| 2 | Import | All | Row counts match ±0% |
| 3 | Parallel | `computer.iai.one` | Read-only queries pass |
| 4 | Cutover | `computer.iai.one` | Smoke tests pass, 2h monitoring green |
| 5 | Parallel | `aiagent.iai.one` | Agent tasks log to infra |
| 6 | Cutover | `aiagent.iai.one` | 2 weeks parallel, no mismatch |
| 7 | Auth cutover | `maytinhai.org`, `tranhatam.com` | Keycloak login success > 99% |
| 8 | Worker migration | `aiaccountingloop.com` | All jobs run on infra |
| 9 | Decommission prep | All | 30-day burn-in complete |
| 10 | Decommission | Supabase | Founder approval |

---

## Communication Plan

| Audience | Message | Channel | Timing |
|----------|---------|---------|--------|
| Users | "System upgrade, possible brief maintenance" | Email + in-app | 7 days before each cutover |
| Developers | Migration runbook + rollback steps | GitHub Wiki | Week 1 |
| Founder | Weekly status report | Email | Every Friday |
| All hands | Post-mortem after each cutover | Meeting | Within 48h of cutover |

---

**WARNING:** Do NOT execute this plan without Founder approval and verified P4 restore test.

**Document Version:** 1.0  
**Last Updated:** 2026-06-05
