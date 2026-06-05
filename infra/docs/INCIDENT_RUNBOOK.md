# Incident Response Runbook

> **Status:** OPERATIONAL  
> **Version:** 1.0  
> **Owner:** SRE Team (Team F)  
> **Pager:** On-call rotation

---

## 1. Incident Classification

| Severity | Definition | Examples | Response Time |
|----------|------------|----------|---------------|
| **SEV-1** | Service down, data loss, security breach | DB unrecoverable, secret leaked, ransomware | 15 min |
| **SEV-2** | Major feature broken, significant data risk | API 500 errors, backup failure, auth broken | 1 hour |
| **SEV-3** | Degraded performance, partial outage | Slow queries, worker backlog, high latency | 4 hours |
| **SEV-4** | Minor issue, no user impact | Log noise, cosmetic bug, non-urgent alert | 24 hours |

---

## 2. Incident Lifecycle

### 2.1 Detect
- Alert from Uptime Kuma, Grafana, or user report
- Log into `evidence_logs` table
- Create incident channel: `#incident-YYYY-MM-DD-severity`

### 2.2 Triage
```bash
# Quick health check
./scripts/health-check.sh

# Check recent logs
docker logs --tail 100 omdala-api
docker logs --tail 100 omdala-worker
docker logs --tail 100 omdala-postgres

# Check metrics
curl https://api.infra.omdala.com/health
curl https://auth.infra.omdala.com/health/ready
```

### 2.3 Respond
| SEV | Action |
|-----|--------|
| 1 | Page on-call. Isolate affected system. Begin rollback. |
| 2 | Alert team. Identify root cause. Apply hotfix or rollback. |
| 3 | Monitor. Identify bottleneck. Apply config change or scale. |
| 4 | Schedule fix. Document in backlog. |

### 2.4 Resolve
- Apply fix or complete rollback
- Verify health check passes
- Monitor for 2x normal duration
- Close incident channel when stable

### 2.5 Review
- Post-mortem within 48 hours for SEV-1/2
- Document in `docs/incidents/YYYY-MM-DD-title.md`
- Update runbook if needed
- Assign follow-up tasks

---

## 3. Specific Scenarios

### Scenario A: PostgreSQL Down

**Symptoms:** API returning 500, health check fails, `pg_isready` returns false

**Steps:**
1. Check disk space: `df -h`
2. Check memory: `free -h`
3. Restart PostgreSQL: `docker restart omdala-postgres`
4. If restart fails, check logs: `docker logs omdala-postgres`
5. If corrupted, initiate restore from backup (see BACKUP_RESTORE.md)
6. **SEV-1:** Page on-call immediately

### Scenario B: Secret Leaked

**Symptoms:** Git monitoring alert, suspicious API usage

**Steps:**
1. Identify leaked secret from alert
2. Revoke secret immediately (Cloudflare dashboard, GitHub, etc.)
3. Rotate all related secrets
4. Check access logs for unauthorized usage
5. Document in evidence_logs
6. **SEV-1:** Page security team

### Scenario C: DDoS Attack

**Symptoms:** High traffic, CPU spike, legitimate users blocked

**Steps:**
1. Check Cloudflare Analytics for source
2. Enable "Under Attack" mode in Cloudflare
3. Check rate limits: are they configured?
4. Identify and block source IPs if possible
5. Scale workers if needed
6. **SEV-2:** Alert team

### Scenario D: Agent Runaway

**Symptoms:** High AI cost, infinite loop in agent task, token usage spike

**Steps:**
1. Identify agent task ID from model_usage table
2. Cancel task: UPDATE agent_tasks SET status='cancelled' WHERE id='...'
3. Check agent configuration for loop conditions
4. Review evidence_logs for root cause
5. Apply cost limit to tenant
6. **SEV-2:** Alert team + Founder (cost impact)

### Scenario E: Backup Failure

**Symptoms:** No backup file in R2, restore test failed

**Steps:**
1. Check backup container logs: `docker logs omdala-backup`
2. Check R2 credentials and connectivity
3. Run manual backup: `./scripts/backup-now.sh`
4. If still failing, check disk space on VPS
5. Use B2 as fallback if R2 unavailable
6. **SEV-2:** Alert team, manual backup required

---

## 4. Communication Templates

### SEV-1 Alert
```
🚨 SEV-1 INCIDENT 🚨
Service: [name]
Impact: [description]
Started: [timestamp]
On-call: [name]
Status: [investigating/mitigating/resolved]
Channel: #incident-YYYY-MM-DD
```

### Status Update
```
📊 UPDATE [timestamp]
Service: [name]
Status: [investigating/mitigating/resolved]
What we know: [summary]
What we're doing: [action]
ETA: [time]
```

### All Clear
```
✅ RESOLVED [timestamp]
Service: [name]
Duration: [X minutes]
Root cause: [summary]
Actions taken: [summary]
Post-mortem: [link]
```

---

## 5. On-Call Rotation

| Week | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| 1 | TBD | TBD | Founder |
| 2 | TBD | TBD | Founder |

**Handoff:** Every Monday 09:00 UTC via #on-call channel

---

## 6. Escalation Matrix

| Level | Contact | When |
|-------|---------|------|
| L1 | On-call engineer | All incidents |
| L2 | Team lead | SEV-1/2, or L1 no response in 15 min |
| L3 | Founder | SEV-1, or L2 no response in 30 min |
| External | Cloudflare support | CF-side issues |
| External | Hetzner support | VPS hardware issues |

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05
