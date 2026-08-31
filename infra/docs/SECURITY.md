# OMDALA Infra Security Policy

> **Status:** ENFORCEABLE  
> **Version:** 1.0  
> **Date:** 2026-06-05  
> **Owner:** Security Team (Team D)  
> **Review:** Quarterly

---

## 1. Threat Model

| Threat | Vector | Impact | Mitigation |
|--------|--------|--------|------------|
| Secret leak in git | Developer error | Critical | `git-secrets`, pre-commit hooks, SOPS, quarterly audit |
| Database breach | Public port exposed | Critical | NO public DNS for PostgreSQL. Hyperdrive only. |
| Credential stuffing | Auth endpoint | High | Rate limiting, CAPTCHA, MFA for admin |
| Privilege escalation | Misconfigured RBAC | High | Least privilege, quarterly access review |
| Supply chain attack | Malicious dependency | High | `package-lock.json` integrity, Dependabot, signed containers |
| Insider threat | Disgruntled employee | Medium | Approval gates, evidence logs, immutable audit |
| DDoS | Edge traffic | Medium | Cloudflare DDoS protection, rate limits |
| Data loss | Backup failure | Critical | Daily R2 + weekly B2, restore test mandatory |

---

## 2. RBAC Matrix

| Role | Tenants | Users | Projects | Agent Tasks | Tool Calls | Approval | Evidence | Billing | Admin |
|------|---------|-------|----------|-------------|------------|----------|----------|---------|-------|
| **superadmin** | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | Read | CRUD | Full |
| **tenant_admin** | Read (own) | CRUD (own) | CRUD (own) | CRUD (own) | CRUD (own) | Read (own) | Read (own) | Read (own) | Limited |
| **developer** | Read (own) | Read (own) | CRUD (own) | CRUD (own) | CRUD (own) | Create (own) | Read (own) | — | — |
| **user** | Read (own) | Read (self) | Read (own) | Read (own) | Read (own) | — | — | Read (own) | — |
| **agent** | Read (own) | — | Read (own) | Create (own) | Create (own) | Create | Create | — | — |
| **readonly** | Read | Read | Read | Read | Read | Read | Read | Read | — |

---

## 3. Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | 16 characters |
| Complexity | Upper, lower, digit, special |
| MFA | Required for admin, optional for users |
| Rotation | 90 days for admin, 180 days for users |
| Reuse prevention | Last 12 passwords |
| Breach check | HaveIBeenPwned API on registration |

---

## 4. Secret Management

### Phase 1 (Now — P5)
- **Production:** Cloudflare Secrets Store
- **CI/CD:** GitHub Actions Secrets
- **Local dev:** `.env` (gitignored, never committed)
- **Encryption at rest:** SOPS + age key

### Phase 2 (P6–P8)
- **HashiCorp Vault production mode** (Raft consensus)
- Dynamic secrets for DB credentials
- Auto-rotation for API keys

### Forbidden
- Vault dev mode in production
- Hardcoded secrets in source code
- Sharing `.env` via Slack/email
- Storing production secrets in 1Password (use Vault)

---

## 5. Network Security

| Rule | Implementation |
|------|---------------|
| PostgreSQL | NO public IP. Hyperdrive or private network only. |
| Admin interfaces | VPN or IP-whitelist |
| SSH | Key-auth only. No password auth. |
| Firewall | UFW: 22, 80, 443 only. Deny all else. |
| Internal services | Docker internal network, no port binding to host. |
| mTLS | Between VPS services (Phase 2) |

---

## 6. Incident Response

| Severity | Response Time | Action |
|----------|---------------|--------|
| **Critical** (breach, data loss) | 15 min | Page on-call, isolate, preserve evidence |
| **High** (service down, secret leak) | 1 hour | Alert team, begin rollback |
| **Medium** (performance degradation) | 4 hours | Investigate, plan fix |
| **Low** (cosmetic, non-urgent) | 24 hours | Schedule fix |

**Incident Runbook:** See `INCIDENT_RUNBOOK.md`

---

## 7. Compliance

| Requirement | Implementation |
|-------------|---------------|
| **GDPR** | Right to erasure (approval-gated), data export API |
| **Audit trail** | Immutable `evidence_logs` + `audit_logs` |
| **Data retention** | 30-day soft delete, 1-year archive, then purge |
| **Encryption at rest** | PostgreSQL TDE, R2 server-side encryption |
| **Encryption in transit** | TLS 1.3 minimum |

---

## 8. Security Checklist (Pre-Deploy)

- [ ] `git-secrets` scan passed
- [ ] SOPS encrypted secrets verified
- [ ] No `.env` in Docker image
- [ ] Container runs as non-root
- [ ] Health endpoint returns 200
- [ ] Rate limits configured
- [ ] CORS restricted to known origins
- [ ] Security headers (HSTS, CSP, X-Frame-Options)
- [ ] Dependency audit (`npm audit`)
- [ ] Container scan (Trivy or Snyk)

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05
