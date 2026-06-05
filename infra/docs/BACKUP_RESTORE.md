# Backup & Restore Runbook

> **Status:** OPERATIONAL  
> **Version:** 1.0  
> **Owner:** Database Team (Team B)  
> **Frequency:** Daily backup, weekly restore test

---

## 1. Backup Strategy

| Type | Schedule | Retention | Destination | Tool |
|------|----------|-----------|-------------|------|
| **pg_dump** (logical) | Daily 02:00 UTC | 30 days | R2 `omdala-prod-backups` | `pg_dump` + `aws s3 cp` |
| **WAL-G** (physical) | Weekly Sunday | 12 weeks | R2 `omdala-prod-backups/postgres/wal` | WAL-G |
| **D1 export** | Weekly | 12 weeks | R2 `omdala-prod-backups/d1` | `wrangler d1 export` |
| **R2 bucket sync** | Daily | 30 days | Backblaze B2 `omdala-archive` | `rclone sync` |
| **KV export** | Weekly | 12 weeks | R2 `omdala-prod-backups/kv` | `wrangler kv namespace list` + export |
| **Config snapshot** | On change | Forever | Git `infra/config-snapshots/` | Git commit |

---

## 2. Backup Verification

### Daily Automated Check
```bash
# Check latest backup exists and is non-empty
aws s3 ls s3://omdala-prod-backups/backups/postgres/ \
  --endpoint-url $R2_ENDPOINT --region auto | tail -1
```

### Weekly Restore Test (MANDATORY)
```bash
# Automated via CI/CD (backup-test.yml)
./scripts/restore-test.sh
```

**Success criteria:**
- Backup file size > 1 KB (not empty)
- Restore to staging DB completes without error
- Row count per table matches production ±0%
- Key constraints validated
- Can connect and query staging DB

---

## 3. Restore Procedures

### 3.1 Point-in-Time Restore (PITR)

**When:** Data corruption, accidental deletion, rollback needed

```bash
# 1. Identify target timestamp
echo "Restore to: 2026-06-01 10:00:00 UTC"

# 2. Find nearest base backup
BASE_BACKUP=$(aws s3 ls s3://omdala-prod-backups/postgres/wal/base/ \
  --endpoint-url $R2_ENDPOINT --region auto \
  | awk '{print $4}' | sort | tail -1)

# 3. Restore base backup + WAL segments
wal-g backup-fetch /tmp/restore $BASE_BACKUP
wal-g wal-fetch --from $TARGET_TIMESTAMP

# 4. Start PostgreSQL on staging port
# 5. Verify data integrity
# 6. Switch production to restored instance OR export corrected data
```

### 3.2 Full Database Restore

**When:** Complete database failure, migration to new server

```bash
# 1. Stop application writes
# 2. Download latest pg_dump
LATEST=$(aws s3 ls s3://omdala-prod-backups/backups/postgres/ \
  --endpoint-url $R2_ENDPOINT --region auto | sort | tail -1 | awk '{print $4}')

aws s3 cp s3://omdala-prod-backups/backups/postgres/$LATEST /tmp/restore.sql.gz \
  --endpoint-url $R2_ENDPOINT --region auto

# 3. Drop and recreate database (WARNING: DESTRUCTIVE)
docker exec omdala-postgres psql -U postgres -c "DROP DATABASE omdala_prod;"
docker exec omdala-postgres psql -U postgres -c "CREATE DATABASE omdala_prod;"

# 4. Restore
gunzip -c /tmp/restore.sql.gz | docker exec -i omdala-postgres psql -U postgres -d omdala_prod

# 5. Verify
# 6. Resume application
```

**⚠️ Requires approval gate:** This is a destructive action.

### 3.3 Single Table Restore

**When:** Only one table is corrupted

```bash
# Extract table from pg_dump
gunzip -c /tmp/restore.sql.gz | grep -A 1000 "CREATE TABLE omdala.users" > /tmp/users_restore.sql

# Truncate and restore single table
docker exec omdala-postgres psql -U omdala_app -d omdala_prod -c "TRUNCATE omdala.users;"
docker exec -i omdala-postgres psql -U omdala_app -d omdala_prod < /tmp/users_restore.sql
```

---

## 4. Disaster Recovery Scenarios

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| VPS failure | 2 hours | 24 hours | Restore from latest pg_dump to new VPS |
| PostgreSQL crash | 30 min | 0 | WAL replay from latest checkpoint |
| Data corruption | 1 hour | 1 hour | PITR to before corruption timestamp |
| Accidental DELETE | 15 min | 0 | Single table restore from pg_dump |
| Ransomware | 4 hours | 24 hours | Full restore from B2 secondary copy |
| Region failure | 8 hours | 24 hours | Restore to new region, update DNS |

---

## 5. Backup Monitoring

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Backup file size | < 50% of average | Investigate (maybe empty DB?) |
| Backup duration | > 2x average | Check DB load, optimize queries |
| Restore test | FAIL | Page on-call, do manual restore |
| R2 upload | FAIL | Retry 3x, then alert + use B2 fallback |
| B2 sync | > 24h behind | Check B2 credentials, retry |

---

## 6. Rollback Checklist

Before any restore:
- [ ] Approval gate passed (2 reviewers + Founder)
- [ ] Evidence log entry created
- [ ] Current state backed up (even if corrupted, for forensics)
- [ ] Staging restore tested
- [ ] Maintenance window announced (if production impact)
- [ ] Rollback plan documented
- [ ] On-call engineer assigned

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05
