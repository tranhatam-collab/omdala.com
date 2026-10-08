# infra.omdala.com — Full Audit and Business Plan

## Date
- 2026-06-06

## Scope
- Local repo audit only
- Path: `omdala.com/infra`
- No production change applied
- No Cloudflare, VPS, Docker, Terraform apply, or secret operation executed in this audit

## Executive Verdict
- `ARCHITECTURE_DIRECTION: STRONG`
- `IMPLEMENTATION_STATUS: PARTIAL`
- `GO_LIVE_STATUS: NOT_READY`
- `SELLING_STATUS: READY_FOR_FOUNDER_LED_PILOT`, not ready for broad self-serve SaaS launch

The project has a coherent direction:
- Cloudflare-first edge
- sovereign PostgreSQL core
- approval-gated operations
- backup and evidence logging discipline

But the implementation is still in a mixed state:
- some service tests pass
- several production paths are still doc-level or partially wired
- multiple bootstrap and compose path errors can block first real deployment
- Terraform and secret management claims are ahead of the proven implementation

## Evidence Checked
- `infra/README.md`
- `infra/docs/ARCHITECTURE.md`
- `infra/docs/DEPLOYMENT.md`
- `infra/docs/SECURITY.md`
- `infra/docs/LOCAL_DEVELOPMENT.md`
- `infra/docs/ADOPTION_GUIDE_AUDIT_2026.md`
- `infra/docs/OMDALA_AUDIT_COMPLETION_REPORT_2026-06-06.md`
- `infra/docker-compose.yml`
- `infra/docker-compose.override.yml`
- `infra/scripts/bootstrap.sh`
- `infra/scripts/health-check.sh`
- `infra/scripts/backup-now.sh`
- `infra/scripts/verify-hyperdrive.sh`
- `infra/scripts/cf-secrets-migrate.sh`
- `infra/tf/main.tf`
- `infra/tf/variables.tf`
- `infra/services/api-gateway/src/**`
- `infra/services/worker/src/**`
- Local test runs:
  - `infra/services/api-gateway` → `23/23 PASS`
  - `infra/services/worker` → `10/10 PASS`

## What Is Actually Good

### 1. Architecture quality is above average
- The target split between Cloudflare Edge and sovereign core is coherent.
- The database isolation rule is correct:
  - no public PostgreSQL DNS
  - Hyperdrive or private network only
- The approval-gate and evidence-log model is sensible for regulated or destructive automation.

### 2. Core service code exists and is testable
- API Gateway has real route implementations for:
  - health
  - users
  - projects
  - tasks
  - approvals
- Worker has real job handlers and a health server.
- Unit tests for both services passed in this environment.

### 3. The product concept is commercially valid
- A multi-tenant sovereign backend with agent control plane, audit trails, approval gates, and migration away from Supabase/Render is a real B2B infrastructure offer.
- The right first buyers are not mass-market developers.
- The right first buyers are founder-led teams that need:
  - controlled AI automation
  - data ownership
  - lower vendor concentration risk
  - private-core deployments

## Critical Findings

### P0 — Deployment path is not yet trustworthy
1. `docker-compose.yml` uses wrong relative paths for a file that already lives inside `infra/`.
   - `infra/docker-compose.yml:23`
   - `infra/docker-compose.yml:56`
   - `infra/docker-compose.yml:117`
   - `infra/docker-compose.yml:149`
   - `infra/docker-compose.yml:237`
   - Impact:
     - `Caddyfile`, init scripts, build contexts, and backup build context can fail when running from `omdala.com/infra`.

2. `bootstrap.sh` assumes the wrong working directory.
   - `infra/scripts/bootstrap.sh:83`
   - It copies `infra/.env.example` even though the script is meant to run from `omdala.com/infra`.
   - This breaks first-run setup.

3. `backup-now.sh` has the same path error in its operator guidance.
   - `infra/scripts/backup-now.sh:8`
   - This is not fatal by itself, but it shows the runbook and script assumptions are not aligned.

4. Terraform expects a Worker artifact that does not exist in the audited tree.
   - `infra/tf/main.tf:77`
   - Expected: `infra/services/api-gateway/dist/worker.js`
   - Actual audit result: file not present
   - Impact:
     - Terraform cannot provision the Worker script from the repo as currently audited.

### P0 — Security and production-mode claims are ahead of implementation
1. Keycloak is configured with `start-dev`.
   - `infra/docker-compose.yml:205-206`
   - This contradicts production positioning.
   - It is acceptable for dev only, not for a production security baseline.

2. Vault/Cloudflare secret abstraction is not production-correct.
   - `infra/services/api-gateway/src/lib/vault-client.js:58-85`
   - The code assumes Cloudflare Workers secrets can be read back as secret values through an account API path.
   - That is not a valid production trust model for runtime secret retrieval.
   - This section is design-grade, not verified production-grade.

3. Health check depends on `aws` CLI from inside the API runtime path.
   - `infra/services/api-gateway/src/routes/health.js:114-118`
   - This couples service health to shell tooling presence, not just application dependencies.
   - It is fragile for containerized production.

### P0 — Some logic claims are not production-safe yet
1. Soft-delete SQL in task delete route is invalid.
   - `infra/services/api-gateway/src/routes/tasks.js:87`
   - `status = deleted` should be a quoted string literal.
   - Tests did not catch this because the DB layer was mocked.

2. Worker `backupJob` builds shell commands with unsanitized inputs.
   - `infra/services/worker/src/jobs/backup.js:14-27`
   - `dbName`, bucket, and endpoint are interpolated directly into shell commands.
   - This is a command-injection risk if upstream validation is weak.

### P1 — Docs and status reporting contradict each other
1. Main README says:
   - `P0 — Cloudflare Inventory (MUST COMPLETE BEFORE BUILD)`
   - `infra/README.md:5`
2. Completion report says:
   - `ALL 21 TASKS COMPLETE`
   - `infra/docs/OMDALA_AUDIT_COMPLETION_REPORT_2026-06-06.md:8`
3. These two states cannot both be true.
4. Current true state from this audit:
   - architecture prepared
   - service tests pass
   - platform not ready for production deployment

### P1 — Local and production docs are not fully synchronized
1. Local development doc says PostgreSQL and MailHog are available locally.
   - `infra/docs/LOCAL_DEVELOPMENT.md:27-30`
2. That only becomes true because of override file, not the base stack.
   - `infra/docker-compose.override.yml:29-53`
3. This is manageable, but the docs should explicitly state "override-dependent".

### P2 — Test quality is useful but incomplete
1. API route tests are mocked integration tests, not real DB or container verification.
2. Worker tests validate handler behavior but do not prove:
   - Redis/BullMQ runtime wiring
   - backup execution against live R2
   - deploy flow against real VPS/Cloudflare
3. Docker is unavailable in this audit environment, so compose-level proof was not executed.

## True State by Area

### Architecture
- `PASS`
- Strong enough to keep and refine

### API Gateway
- `PARTIAL PASS`
- Good base
- Needs production-hardening and real integration checks

### Worker
- `PARTIAL PASS`
- Good base
- Still needs command-safety, queue proof, and external service proof

### PostgreSQL schema
- `PASS FOR DESIGN`
- Not enough evidence yet for migration correctness against all source systems

### Backup and restore
- `PARTIAL`
- Scripts exist
- No live restore proof in this audit

### Terraform and Cloudflare provisioning
- `BLOCKED`
- Config exists
- Worker artifact path and external account requirements are unresolved here

### Security posture
- `PARTIAL`
- Threat model is serious
- implementation still contains dev-mode and secret-model gaps

## What Must Be True Before Real Go-Live

### Technical gates
1. Fix all `infra/` path resolution issues in compose and scripts.
2. Replace Keycloak `start-dev` with a production-grade startup path or replace Phase 1 auth with Cloudflare Access bridge if that is the actual chosen path.
3. Fix invalid SQL in task delete route.
4. Replace shell-interpolated backup commands with argument-safe execution.
5. Replace R2 health strategy with an SDK-based check, not `aws` CLI in request path.
6. Make Terraform artifact path real:
   - either generate the worker bundle
   - or stop claiming Terraform deploys the Worker
7. Run live proof:
   - docker compose up
   - health check pass
   - backup pass
   - restore pass
   - Hyperdrive verification pass
   - one real JWT flow pass
   - one real approval flow pass

### Operational gates
1. Founder-approved source of truth:
   - one single status file
   - remove contradictory "complete" language
2. One named owner per lane:
   - Edge
   - DB
   - Auth
   - Worker
   - Monitoring
   - Backup
3. Incident rotation:
   - who gets paged
   - where alerts land
   - restore authority and founder override

### Commercial gates
1. Do not sell this yet as mass self-serve infra SaaS.
2. Sell it first as a managed private platform offer with onboarding.
3. First 3 customers should be pilot accounts with founder oversight.

## Recommended Business Positioning

### Product thesis
`infra.omdala.com` should not be positioned as generic hosting.

It should be positioned as:
- sovereign AI backend platform
- Cloudflare-first edge + private-core control plane
- agent-safe operations platform
- migration path off Supabase/Render sprawl
- approval-gated backend for multi-project ecosystems

### Best first customer profile
- founder-led startups with 2-20 engineers
- AI products handling internal automation or sensitive workflows
- teams already on Cloudflare and tired of fragmented stacks
- organizations needing private PostgreSQL but not ready for full Kubernetes

### Bad first customer profile
- hobby users
- one-site brochure businesses
- customers expecting instant self-serve setup without onboarding
- enterprises demanding SOC2/ISO evidence before the platform itself is stabilized

## Recommended Offer Structure

### Offer 1 — Managed Pilot
- Best for first 3-10 customers
- OMDALA team deploys and operates the stack
- Includes:
  - infra blueprint
  - tenant setup
  - auth bridge
  - backup policy
  - monitoring baseline
  - migration advisory

### Offer 2 — Sovereign Core for Growth Teams
- Managed private-core backend
- Includes:
  - API gateway
  - worker runtime
  - PostgreSQL + backup
  - approval system
  - alerting and evidence logs

### Offer 3 — Enterprise Private Control Plane
- High-touch, contract-led
- Includes:
  - isolated environment
  - custom auth / SSO
  - migration program
  - security review lane
  - custom SLA and support

## Proposed Pricing

### Why not price too low
- This is not commodity VM resale.
- The value is:
  - architecture consolidation
  - migration risk reduction
  - governance
  - multi-tenant backend patterns
  - private-core operations

### Recommended launch pricing

1. Pilot Setup Fee
- `30,000,000 VND - 60,000,000 VND` one-time
- Use for:
  - architecture fit
  - first deployment
  - migration map
  - security baseline
  - first restore proof

2. Managed Pilot Monthly
- `12,000,000 VND - 18,000,000 VND / month`
- Up to:
  - 1 production tenant
  - 1 staging environment
  - shared support hours
  - monitoring + backup + patch lane

3. Growth Plan
- `25,000,000 VND - 40,000,000 VND / month`
- Includes:
  - multi-project onboarding
  - auth bridge
  - worker operations
  - migration support
  - quota / cost reporting
  - faster response window

4. Enterprise Private Control Plane
- `70,000,000 VND+ / month`
- Plus setup/migration fee by scope
- Includes:
  - isolated deployment
  - custom SSO / governance
  - approval workflows
  - higher-touch ops
  - contractual support

### Migration service add-on
- `20,000,000 VND - 120,000,000 VND`
- Depends on:
  - number of apps
  - D1/Supabase export complexity
  - auth migration
  - rollback requirements

## Suggested Pricing Logic vs Market

### External benchmark context
- Supabase Pro starts from `$25/month`
- Auth0 Essentials starts from `$35/month`
- n8n hosted Starter is `20 EUR/month`, Pro is `50 EUR/month`
- Backblaze B2 starts at `$6.95 / TB / mo`
- Cloudflare Workers pricing includes `100k/day` free for some products and `0.30 USD / million requests` on paid usage
- Hetzner current cloud pricing moved upward in 2026, with mid-tier cloud servers in the rough `16 EUR - 31.49 EUR / month` range depending on instance class and location

### Interpretation
- Your direct infrastructure cost is still relatively low.
- Your selling price should be driven by:
  - migration complexity
  - operational control
  - reduction of vendor sprawl
  - incident and compliance posture
- Therefore:
  - do not anchor on raw VPS cost
  - anchor on managed-risk and time-to-stability

## Revenue Strategy

### Phase 1 — Founder-led pilot sales
- Goal:
  - 3 paying pilots
  - 2 internal OMDALA properties migrated successfully
  - 90 days of operational proof
- Sales motion:
  - direct founder outreach
  - architecture review call
  - paid pilot proposal

### Phase 2 — Case-study-led growth
- Goal:
  - 5-10 customers
  - repeatable onboarding
  - one standard contract
- Needed:
  - before/after migration case studies
  - cost reduction proof
  - restore proof
  - incident response proof

### Phase 3 — Narrow self-serve surface
- Only after:
  - deployment path is standardized
  - auth path is stable
  - billing and tenancy are production-proven
- Self-serve should begin with:
  - diagnostics
  - project inventory
  - migration assessment
  - not full autonomous deploy on day one

## What Running It For Real Requires

### Team
- 1 infra lead
- 1 backend/platform engineer
- 1 security/auth owner
- 1 DBA or strong backend engineer owning backup/restore
- founder approval lane for destructive or trust-sensitive actions

### Systems
- 1 primary VPS
- Cloudflare account with confirmed ownership and inventory
- R2 buckets
- backup destination policy
- domain and DNS ownership
- alert destination
- credential rotation policy

### Process
- one release board
- one runbook
- one restore drill every week
- one real staging environment
- one customer onboarding checklist
- one support boundary document

### Commercial assets
- landing page for the offer
- architecture explainer
- pricing sheet
- pilot statement of work
- migration checklist
- security FAQ

## Recommended Founder Decision

### Approve now
- Keep the architecture direction
- Keep Cloudflare-first + sovereign core positioning
- Sell as managed pilot first
- Use pricing bands above as commercial starting point

### Do not approve yet
- Any public claim that the infra platform is production-complete
- Any self-serve launch
- Any enterprise compliance promise beyond what is already evidenced

## Next Build Order After Approval
1. Fix pathing and bootstrap defects
2. Fix SQL and shell-safety defects
3. Make one real staging deployment work end-to-end
4. Run one successful backup and restore proof
5. Freeze one truthful release-readiness report
6. Build commercial package and founder sales deck

## Final True State
- The project is valuable.
- The architecture is worth continuing.
- The current repo is not ready to be treated as a finished infrastructure product.
- It is ready to become a managed pilot offer after one hardening sprint and one real staging proof cycle.
