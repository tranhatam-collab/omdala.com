# OMDALA Disaster Recovery Playbook (15-Minute Target)

## Purpose

Provide an emergency procedure to restore OMDALA PostgreSQL service within a 15-minute operational recovery window.

This playbook assumes backups are available and API is deployed on Cloudflare Workers.

---

## 1. Recovery Objectives

- RTO target: 15 minutes
- RPO target: up to last successful backup (improve with more frequent backup policy)

---

## 2. Incident Trigger Conditions

Run this playbook when one or more occur:

- DB unreachable from API
- data corruption detected
- accidental destructive schema/data change
- infrastructure failure on DB host

---

## 3. Roles

- Incident Lead: coordinates decisions and communication
- DB Operator: performs restore operations
- API Operator: validates app/API after restore
- Recorder: logs timeline and actions

---

## 4. Required Inputs

- working backup file path
- production `DATABASE_URL`
- VPS or DB admin access
- API health endpoint access

---

## 5. 15-Minute Recovery Procedure

### Minute 0-2: Contain

1. Freeze risky writes if possible (maintenance mode if available).
2. Confirm incident type and backup target to restore.

### Minute 2-6: Prepare target

1. Ensure PostgreSQL service is running.
2. Verify disk space is sufficient.
3. Verify target database exists and credentials are valid.

### Minute 6-11: Restore

Run:

```bash
DATABASE_URL="postgresql://..." bash scripts/backup/omdala_pg_restore.sh /path/to/omdala_prod_YYYYMMDD_HHMMSS.sql.gz
```

If restoration target is a fresh DB instance, re-apply schema only if backup does not include schema.

### Minute 11-13: Reconnect API

1. Ensure Worker secret `DATABASE_URL` points to recovered DB.
2. Redeploy API Worker:

```bash
cd services/api
pnpm run deploy
```

### Minute 13-15: Verify

Run smoke checks:

```bash
BASE="https://omdala-api.tranhatam66.workers.dev"
curl -s "$BASE/v2/reality/health"
curl -s "$BASE/v2/reality/nodes"
curl -s "$BASE/v2/reality/commitments"
curl -s "$BASE/v2/reality/trust"
```

Success criteria:

- health endpoint returns `persistence: "postgres"`
- core list endpoints return valid JSON
- no critical errors in logs

---

## 6. Post-Recovery Checklist

- [ ] Confirm data consistency with operator spot checks.
- [ ] Resume normal write traffic.
- [ ] Record incident timeline and root cause.
- [ ] Rotate credentials if compromise suspected.
- [ ] Schedule preventive fix and test.

---

## 7. Preventive Controls

- daily automated backup and prune policy
- periodic restore drills
- restricted DB access and firewall rules
- monitored API + DB health alerts

---

## 8. Command Quick Reference

Backup:

```bash
DATABASE_URL="postgresql://..." BACKUP_DIR="/var/backups/omdala" bash scripts/backup/omdala_pg_backup.sh
```

Restore:

```bash
DATABASE_URL="postgresql://..." bash scripts/backup/omdala_pg_restore.sh /var/backups/omdala/omdala_prod_YYYYMMDD_HHMMSS.sql.gz
```

Set Worker DB secret:

```bash
cd services/api
pnpm exec wrangler secret put DATABASE_URL
```
