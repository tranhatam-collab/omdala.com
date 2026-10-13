# OMDALA VPS Postgres Hardening Checklist 2026

## Purpose

This checklist secures a self-hosted PostgreSQL instance for OMDALA production use.

It is designed for a VPS environment where PostgreSQL is exposed to Cloudflare Worker API traffic.

---

## 1. Base Host Security

- [ ] Create a non-root sudo user and disable direct root SSH login.
- [ ] Enforce SSH key auth and disable password login.
- [ ] Change default SSH port or restrict access by source IP.
- [ ] Enable automatic security updates.
- [ ] Install and configure `ufw` (or equivalent firewall).
- [ ] Keep only required ports open (22, 443, and 5432 if remote DB access is required).
- [ ] Restrict 5432 ingress to known source IPs only whenever possible.

---

## 2. PostgreSQL Configuration Hardening

Files to review:

- `/etc/postgresql/<version>/main/postgresql.conf`
- `/etc/postgresql/<version>/main/pg_hba.conf`

### postgresql.conf

- [ ] `listen_addresses` set explicitly (avoid broad `*` unless strictly needed).
- [ ] `password_encryption = scram-sha-256`
- [ ] `ssl = on` (recommended for remote production traffic).
- [ ] `log_connections = on`
- [ ] `log_disconnections = on`
- [ ] `log_statement = 'ddl'` (or stricter by policy).
- [ ] `log_min_duration_statement` configured (e.g., 500ms) for performance visibility.

### pg_hba.conf

- [ ] Use `scram-sha-256` auth method.
- [ ] Restrict client CIDR ranges.
- [ ] Remove broad `0.0.0.0/0` entries when not necessary.
- [ ] Keep local postgres admin access only where needed.

---

## 3. Database Roles and Privileges

- [ ] Create dedicated app user (`omdala_api`) with strong generated password.
- [ ] Separate admin role from application role.
- [ ] Grant minimum privileges required by the app.
- [ ] Revoke unnecessary default privileges.
- [ ] Rotate credentials regularly.

Example baseline:

```sql
CREATE USER omdala_api WITH ENCRYPTED PASSWORD 'REPLACE_ME';
CREATE DATABASE omdala_prod OWNER omdala_api;
REVOKE ALL ON DATABASE omdala_prod FROM PUBLIC;
```

---

## 4. Secret Management

- [ ] Never store production DB credentials in Git.
- [ ] Store app-side credentials in Cloudflare Worker Secrets (`DATABASE_URL`).
- [ ] Keep local `.env` files out of repo.
- [ ] Maintain credential rotation procedure.

---

## 5. Observability and Alerts

- [ ] Enable PostgreSQL logs and rotate logs safely.
- [ ] Monitor CPU, RAM, disk, and I/O.
- [ ] Alert on low disk space, high memory pressure, and restart failures.
- [ ] Track DB connection count and long-running queries.

---

## 6. Backup and Retention

- [ ] Daily full backup with `pg_dump`.
- [ ] Optional WAL/incremental strategy for tighter RPO.
- [ ] Encrypt backup at rest.
- [ ] Keep at least 7 daily + 4 weekly + 3 monthly backups.
- [ ] Store backups on separate volume or remote storage.
- [ ] Run restore test at least monthly.

---

## 7. Incident Readiness

- [ ] Document production DB endpoint, user, and restore process.
- [ ] Keep emergency runbook for 15-minute restore target.
- [ ] Validate restore and app reconnection steps.
- [ ] Keep rollback command sequence prepared.

---

## 8. OMDALA-Specific Safety Checks

- [ ] `events` table remains append-only by policy.
- [ ] `trust_score_history` is retained for auditability.
- [ ] Proof metadata stored in SQL, binary objects in object storage.
- [ ] Domain lock remains global (`*.omdala.com`) and auth remains under global domain.

---

## 9. Acceptance Criteria (Go-Live)

Go-live is approved only when:

- [ ] DB credentials are secret-managed.
- [ ] Firewall rules are minimal and verified.
- [ ] Backup job runs successfully.
- [ ] Restore dry-run completed.
- [ ] API health shows `persistence = postgres`.
