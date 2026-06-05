# MASTER EXECUTION PLAN — 10/10 — Cloudflare-First Architecture
**Ngày:** 2026-06-05  
**Phiên bản:** 1.0 — Founder-Locked  
**Auditor/Author:** Claude (Senior Architect + Team Admin)  
**Scope:** Toàn bộ hệ sinh thái: omdala.com · aiagent.iai.one · OMCODE · iai.one  
**Status:** ACTIVE — Dev Team Execution  
**Thay thế:** OMDALA_SINGLE_TEAM_MASTER_PLAN_2026-05-19.md (về mặt kiến trúc CF-first)

---

## 0) PHÁN QUYẾT BASELINE (verified bằng lệnh thật 2026-06-05)

### Điểm hiện tại theo layer:

| Layer | Điểm thật | Vấn đề chính |
|-------|-----------|--------------|
| omdala.com code | 72/100 | F1-F3 blocker (TS errors, page.js, Node 24) |
| OMCODE desktop | 78/100 | git corruption, commit pending |
| CF Infra clarity | 41/100 | 3 accounts không rõ canonical; 20+ D1 "0 tables" |
| aiagent.iai.one | 58/100 | Quota real nhưng PostgreSQL chưa connected |
| Agent Control Plane | 15/100 | Schema chưa tồn tại |
| Security posture | 45/100 | Keys in env/wrangler, Vault chưa có |
| **Tổng hợp** | **~52/100** | |

### Definition of Done = 10/10 (100 điểm):

```
1.  [ ] CF Inventory Map hoàn chỉnh + canonical account locked
2.  [ ] omdala.com: 10 build+test conditions PASS (evidence lệnh thật)
3.  [ ] OMCODE: git recovered + build #13 committed + app chạy thật
4.  [ ] Hyperdrive → omdala_prod schema verified + API wire live
5.  [ ] Agent Control Plane schema deployed + approval gate live
6.  [ ] aiagent.iai.one: Hyperdrive connected + quota working với key thật
7.  [ ] Secrets: CF Secrets Store thay hardcode .env
8.  [ ] Backup: PostgreSQL dump verified restore test pass
9.  [ ] CI/CD: tất cả app có wrangler deploy hoặc pages deploy từ git
10. [ ] Release evidence packet: output lệnh thật, không self-report
```

Không đạt 1 = không 10/10.

---

## 1) KIẾN TRÚC CHUẨN (Cloudflare-First + PostgreSQL Sovereign)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE EDGE LAYER (DNS + CDN + WAF + DDoS — Always CF)         │
│  Tất cả domain đều dùng CF DNS. Không bao giờ expose origin IP.     │
└──────────┬──────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE WORKERS LAYER (Edge compute)                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ aiagent-iai-one  │  │ omdala-api       │  │ Agent Control    │  │
│  │ Worker           │  │ Worker           │  │ Plane Worker     │  │
│  │ account: f3f9    │  │ account: f3f9    │  │ account: f3f9    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼────────────────────┼─────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE HYPERDRIVE (Connection pooling → PostgreSQL sovereign)   │
│  id: 6d2bcb040e38450a9700b102000bf1e7                               │
│  host: mail.iai.one:5432  db: omdala_prod  user: omdala_api         │
│  ← Đây là tài sản quan trọng nhất, phải activate trước              │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  POSTGRESQL SOVEREIGN CORE (VPS mail.iai.one)                        │
│  Schema: tenants · users · projects · agent_tasks · agent_runs      │
│  tool_permissions · approval_requests · evidence_logs               │
│  model_usage · billing_events · audit_logs                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          ▼                ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  CF R2 (Primary  │  │  CF KV           │  │  CF D1           │
│  Object Storage) │  │  (Sessions +     │  │  (Lightweight    │
│  account: f3f9   │  │   Cache)         │  │   metadata only) │
│  aiagent-files   │  │  account: f3f9   │  │  aiagent-registry│
└──────────────────┘  └──────────────────┘  └──────────────────┘

RULE: D1 KHÔNG chứa user data chính. Chỉ config, registry, cache.
RULE: VPS chỉ chạy PostgreSQL + Keycloak (nếu cần) + n8n nội bộ.
RULE: MinIO = local dev ONLY. R2 = production storage.
RULE: Vault: Phase 1 = CF Secrets Store. Phase 2 = Vault prod. KHÔNG dùng Vault dev mode.
```

---

## 2) CLOUDFLARE ACCOUNT MAP (Canonical — Locked 2026-06-05)

### 3 accounts hiện có:

| Account | Email | ID | Vai trò chính thức |
|---------|-------|----|--------------------|
| **CANONICAL PRODUCTION** | Tranhatam66@gmail.com | `93112cc89181e75335cbd7ef7e392ba3` | omdala.com, iai.one, nhachung.org, omdalat.com |
| **AI/AGENT PRODUCTION** | Tranhatam@gmail.com | `f3f9e76222dcb488d5e303e29e8ba192` | aiagent.iai.one, computer.iai.one, trust.iai.one, muonnoi, maytinhai |
| **PERSONAL/ARCHIVE** | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | Personal projects, không deploy production mới |

### Inventory Map — Account `93112cc8` (CANONICAL):

| Resource | Type | Linked App | Verdict | Action |
|----------|------|------------|---------|--------|
| `omdala-web` Pages | Pages | omdala.com | ✅ KEEP | Add git deploy |
| `omdala-app` Pages | Pages | app.omdala.com | ✅ KEEP | Add git deploy |
| `omdala-auth` Pages | Pages | auth.omdala.com | ✅ KEEP | Add git deploy |
| `omdala-docs` Pages | Pages | docs.omdala.com | ✅ KEEP | Add git deploy |
| `omdala-admin` Pages | Pages | admin.omdala.com | ✅ KEEP | Add git deploy |
| `omdalat-app` Pages | Pages | omdalat.com | ✅ KEEP SEPARATE | Không nhầm với omdala |
| `omdalat-web` Pages | Pages | www.omdalat.com | ✅ KEEP SEPARATE | |
| `iai-root` Pages | Pages | iai.one | ✅ KEEP | |
| `iai-web` Pages | Pages | app.iai.one | ✅ KEEP | |
| `iai-home` Pages | Pages | home.iai.one | ✅ KEEP | |
| `iai-flow-frontend` Pages | Pages | flow.iai.one | ⏸️ KEEP | Wire API |
| `nhachung-app` Pages | Pages | nhachung.org | ✅ KEEP | |
| `nhachung-landing` Pages | Pages | (no domain) | 🗑️ ARCHIVE | Merge vào nhachung-app |
| `iai-developer` Pages | Pages | developer.iai.one | ✅ KEEP | |
| `cios-iai-one` Pages | Pages | cios.iai.one | ⏸️ KEEP | Verify app |
| `ai-omdala-home` Pages | Pages | (orphan) | 🗑️ ARCHIVE | |
| `phuongdong-us` Pages | Pages | (orphan) | ⏸️ AUDIT | |
| `NHACHUNG_DB` D1 | D1 | nhachung.org | ✅ KEEP | Verify schema |
| `iai-db` D1 | D1 | iai.one | ⏸️ AUDIT | Check tables |
| `iai-flow-db` D1 | D1 | flow.iai.one | ⏸️ AUDIT | Check tables |
| `omdala-reality-prod` D1 | D1 | NONE | 🗑️ ARCHIVE | 12KB empty |
| `omdala-omniverse` D1 | D1 | NONE | 🗑️ ARCHIVE | 208KB unlinked |
| `cios-workers-api-db` D1 | D1 | cios.iai.one | ⏸️ AUDIT | |
| `tramsaigon-db` D1 | D1 | tramsaigon.com | ⏸️ AUDIT | |
| `intent-os-db` D1 | D1 | intent-os | ⏸️ AUDIT | New (May 17) |
| `iai-flow-files` R2 | R2 | flow.iai.one | ✅ KEEP | |
| `iai-media` R2 | R2 | iai.one | ✅ KEEP | |
| `iai-media-dev` R2 | R2 | iai.one dev | ✅ KEEP | |
| `intent-os-artifacts` R2 | R2 | intent-os | ⏸️ AUDIT | |
| `omdala-postgres` Hyperdrive | Hyperdrive | NONE LIVE YET | 🔥 ACTIVATE NOW | |
| `SESSIONS` KV | KV | ? | ⏸️ AUDIT | |
| `CIOS_KV` KV | KV | cios.iai.one | ⏸️ AUDIT | |
| `PUBLISH_KV` KV | KV | ? | ⏸️ AUDIT | |

### Inventory Map — Account `f3f9e762` (AI/AGENT):

| Resource | Type | Linked App | Verdict | Action |
|----------|------|------------|---------|--------|
| `aiagent-registry` D1 | D1 | aiagent.iai.one | ✅ KEEP | Verify schema |
| `aiagent-files` R2 | R2 | aiagent.iai.one | ✅ KEEP | Already in wrangler.toml |
| `tranhatam-core` D1 | D1 | tranhatam.com | ✅ KEEP | |
| `iai-flow-core-prod` D1 | D1 | flow.iai.one | ⏸️ AUDIT | |
| `omdalat-core` D1 | D1 | omdalat.com | ⏸️ AUDIT | |
| `pay-iai-one-prod` D1 | D1 | pay.iai.one | ✅ KEEP | |
| `life-code-db` D1 | D1 | lifecode.iai.one | ✅ KEEP | |
| `muonnoi_db` D1 | D1 | muonnoi.org | ✅ KEEP | |
| `maytinhai-public` D1 | D1 | maytinhai.org | ✅ KEEP | |
| `audit-binder-prod` D1 | D1 | audit system | ✅ KEEP | |
| `reconciliation-prod` D1 | D1 | accounting | ✅ KEEP | |
| `trust_iai_one_db` D1 | D1 | trust.iai.one | ✅ KEEP | |
| `audit-binders-prod` R2 | R2 | audit system | ✅ KEEP | |
| `cf-r2-dsts-media-prod` R2 | R2 | media | ✅ KEEP | |
| `iai-flow-files` R2 | R2 | flow.iai.one | ✅ KEEP | |

---

## 3) BACKLOG THỰC THI — TUẦN TỰ TUYỆT ĐỐI

### PHASE P0 — FOUNDATION FIX (Blocker toàn bộ — làm ngay)

> **Exit P0 khi:** 3 blocker omdala PASS + OMCODE committed + inventory file tồn tại

---

#### P0.1 — Fix 3 OMDALA code blockers

**Thời gian estimate:** 2 giờ  
**Người làm:** Dev 1  

**F1: model-router.ts TypeScript errors** (5 errors, packages/core)

```bash
# File: packages/core/src/model-router.ts
# Lines: 342, 373, 411, 414, 416
# Error: 'data' is of type 'unknown'
```

Fix pattern cho mỗi occurrence:
```typescript
// TRƯỚC (lỗi):
const result = data.someField;

// SAU (đúng):
const result = (typeof data === 'object' && data !== null && 'someField' in data)
  ? (data as Record<string, unknown>).someField
  : undefined;
```

Verify:
```bash
cd /Users/tranhatam/Documents/Devnewproject/omdala.com
npm --prefix services/api run check
# Expected: EXIT 0, no errors
```

**F2: Xoá apps/web/app/page.js (legacy drift)**

```bash
cd /Users/tranhatam/Documents/Devnewproject/omdala.com
git rm apps/web/app/page.js
git rm apps/web/app/layout.js  # nếu còn
# Verify page.tsx vẫn còn:
ls apps/web/app/page.tsx  # phải tồn tại
grep -ri "omdalat\|omniverse" apps/web/app content/ 2>/dev/null | head -5
# Expected: empty output
```

**F3: apps/app Node 20 fix**

```bash
# Option A: Force Node 20 trong script (khuyến nghị vì không ảnh hưởng global)
# Thêm vào apps/app/package.json:
# "engines": { "node": ">=20 <22" }

# Verify build với Node 20:
PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" apps/app/node_modules/.bin/next build
# Expected: PASS
```

---

#### P0.2 — OMCODE Desktop Git Recovery + Commit

**Thời gian estimate:** 30 phút  
**Người làm:** Dev 2  

```bash
cd /Users/tranhatam/Documents/Devnewproject/CODE.OMDALA.COM/CODE.OMDALA.COM

# Bước 1: Remove stale lock
rm -f .git/index.lock

# Bước 2: Rebuild index từ HEAD (safe — không mất working tree)
git read-tree HEAD

# Bước 3: Verify HEAD readable
git status --short 2>&1 | head -5

# Bước 4: Apply recovery bundle
RECOVER=/Users/tranhatam/Documents/Devnewproject/omcode-desktop-recovery-2026-05-30
for f in $(find "$RECOVER" -type f -not -name README.md -not -name '.DS_Store'); do
  rel="${f#$RECOVER/}"
  mkdir -p "$(dirname "$rel")"
  cp "$f" "$rel"
done

# Bước 5: Stage chỉ 13 files đã verify (build #13 PASS)
git add \
  apps/desktop/src-tauri/Cargo.toml \
  apps/desktop/src-tauri/Cargo.lock \
  apps/desktop/src-tauri/src/main.rs \
  apps/desktop/src-tauri/capabilities/default.json \
  apps/desktop/src/renderer/App.tsx \
  apps/desktop/src/renderer/screens/CommandCenter.tsx \
  apps/desktop/src/renderer/screens/ProjectWorkspace.tsx \
  apps/desktop/src/renderer/screens/ProviderSetup.tsx \
  apps/desktop/src/renderer/screens/SettingsScreen.tsx \
  apps/desktop/src/renderer/store/types.ts \
  apps/desktop/src/renderer/utils/apiClient.ts \
  apps/desktop/src/renderer/utils/commandPolicy.ts \
  apps/desktop/src/renderer/utils/secureStorage.ts

# Bước 6: Commit
git commit -m "feat(desktop): wire api.aiagent.iai.one + Approval Gate + SSE streaming + Keychain (build #13 verified)"

# Verify:
git log --oneline -3
```

---

#### P0.3 — Tạo CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md

**Thời gian estimate:** 1 giờ  
**Người làm:** Dev 1 hoặc Founder  

File path: `docs/CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md`  
Nội dung: Chép từ §2 của kế hoạch này, bổ sung:
- Action column cho mỗi resource
- Owner
- Deadline cleanup

---

### PHASE P1 — ACTIVATE HYPERDRIVE (PostgreSQL Sovereign Core)

> **Exit P1 khi:** Hyperdrive → omdala_prod verified live, schema deployed, Worker test pass

> **⚠️ QUAN TRỌNG:** Hyperdrive `omdala-postgres` id=`6d2bcb040e38450a9700b102000bf1e7` là tài sản quan trọng nhất. Nó đã live nhưng KHÔNG app nào đang dùng. Phải activate ngay.

---

#### P1.1 — Verify PostgreSQL schema thật

```bash
# Tạo test Worker tạm thời để probe schema:
cat > /tmp/probe-worker.js << 'EOF'
export default {
  async fetch(req, env) {
    const result = await env.DB.prepare(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `).all();
    return Response.json(result);
  }
}
EOF

# wrangler.toml cho probe:
cat > /tmp/probe-wrangler.toml << 'EOF'
name = "hyperdrive-probe"
main = "/tmp/probe-worker.js"
compatibility_date = "2026-01-01"
account_id = "93112cc89181e75335cbd7ef7e392ba3"

[[hyperdrive]]
binding = "DB"
id = "6d2bcb040e38450a9700b102000bf1e7"
EOF

CLOUDFLARE_ACCOUNT_ID=93112cc89181e75335cbd7ef7e392ba3 \
  npx wrangler dev /tmp/probe-worker.js --config /tmp/probe-wrangler.toml --remote
# Vào http://localhost:8787 để xem tables hiện có
```

---

#### P1.2 — Deploy PostgreSQL schema (Agent Control Plane)

**File:** `services/api/src/migrations/001_agent_control_plane.sql`

```sql
-- Agent Control Plane Schema — omdala_prod
-- Deploy: psql postgresql://omdala_api@mail.iai.one:5432/omdala_prod < 001_agent_control_plane.sql

CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  domain      TEXT UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  email       TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role        TEXT NOT NULL DEFAULT 'member',
  api_key_hash TEXT,  -- bcrypt hash, bao giờ cũng null nếu dùng CF Access
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  user_id     UUID REFERENCES users(id),
  name        TEXT NOT NULL,
  path        TEXT,
  type        TEXT,  -- react | node | python | other
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id),
  user_id     UUID REFERENCES users(id),
  session_id  TEXT NOT NULL,
  type        TEXT NOT NULL,  -- chat | code | deploy | audit
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | running | done | failed | rejected
  prompt      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES agent_tasks(id),
  model       TEXT NOT NULL,
  provider    TEXT NOT NULL,
  tokens_in   INTEGER DEFAULT 0,
  tokens_out  INTEGER DEFAULT 0,
  cost_usd    NUMERIC(10,6) DEFAULT 0,
  latency_ms  INTEGER,
  status      TEXT NOT NULL,  -- completed | error | timeout
  response    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  tool_name   TEXT NOT NULL,
  tier        TEXT NOT NULL DEFAULT 'review',  -- safe | review | dangerous
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, tool_name)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES agent_tasks(id),
  command     TEXT NOT NULL,
  tier        TEXT NOT NULL,  -- review | dangerous
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES agent_tasks(id),
  run_id      UUID REFERENCES agent_runs(id),
  event_type  TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  model       TEXT NOT NULL,
  provider    TEXT NOT NULL,
  tokens_in   INTEGER DEFAULT 0,
  tokens_out  INTEGER DEFAULT 0,
  cost_usd    NUMERIC(10,6) DEFAULT 0,
  period_day  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  resource    TEXT,
  resource_id TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_tasks_session ON agent_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user ON agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_task ON agent_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_task ON evidence_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_model_usage_user_day ON model_usage(user_id, period_day);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
```

Deploy command:
```bash
# Từ VPS hoặc qua SSH tunnel:
psql "postgresql://omdala_api@mail.iai.one:5432/omdala_prod" \
  < services/api/src/migrations/001_agent_control_plane.sql

# Verify:
psql "postgresql://omdala_api@mail.iai.one:5432/omdala_prod" \
  -c "\dt" 2>&1
# Expected: 10 tables listed
```

---

#### P1.3 — Wire omdala-api Worker → Hyperdrive

**File sửa:** `services/api/wrangler.toml`

```toml
name = "omdala-api"
main = "src/index.ts"
compatibility_date = "2026-03-17"
account_id = "f3f9e76222dcb488d5e303e29e8ba192"
compatibility_flags = ["nodejs_compat"]

[dev]
port = 8789

# ─── Hyperdrive → PostgreSQL sovereign ───────────────────────────────────────
[[hyperdrive]]
binding = "OMDALA_DB"
id = "6d2bcb040e38450a9700b102000bf1e7"
```

**File sửa:** `services/api/src/index.ts` (thêm DB type)

```typescript
// Thêm vào Env interface:
interface Env {
  OMDALA_DB: Hyperdrive;
  // ... existing
}

// Sử dụng:
const db = env.OMDALA_DB;
const result = await db.prepare('SELECT * FROM tenants LIMIT 1').all();
```

Verify local dev:
```bash
cd services/api
CLOUDFLARE_ACCOUNT_ID=93112cc89181e75335cbd7ef7e392ba3 \
  npx wrangler dev --remote
curl http://localhost:8789/v1/health
# Expected: { "ok": true, "db": "connected" }
```

---

#### P1.4 — Wire aiagent-iai-one API → Hyperdrive (optional: usage logging)

**File sửa:** `aiagent.iai.one/apps/agent-api/wrangler.toml`

```toml
# Thêm vào wrangler.toml hiện có:
[[hyperdrive]]
binding = "OMDALA_DB"
id = "6d2bcb040e38450a9700b102000bf1e7"
```

Mục đích: log `model_usage` + `agent_runs` vào PostgreSQL thay vì chỉ KV.

---

### PHASE P2 — OMDALA.COM: 10/10 BUILD CONDITIONS

> **Exit P2 khi:** 10 lệnh verify tất cả PASS với output thật

---

#### P2.1 — Final Verification Matrix (chạy tuần tự, không skip)

```bash
# Cwd: /Users/tranhatam/Documents/Devnewproject/omdala.com

# 1. Package manager
pnpm install --frozen-lockfile
echo "CHECK 1: $?"

# 2. services/api TypeScript
npm --prefix services/api run check
echo "CHECK 2: $?"

# 3-7. Five Next.js builds (dùng Node 20 cho apps/app)
apps/web/node_modules/.bin/next build
echo "CHECK 3: $?"

PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" \
  apps/app/node_modules/.bin/next build
echo "CHECK 4: $?"

apps/admin/node_modules/.bin/next build
echo "CHECK 5: $?"

apps/docs/node_modules/.bin/next build
echo "CHECK 6: $?"

apps/auth/node_modules/.bin/next build
echo "CHECK 7: $?"

# 8. Brand lint
npm run brand:lint && \
npm run brand:lint:static && \
npm run build:static
echo "CHECK 8: $?"

# 9. Bilingual scripts
node scripts/bilingual-source-check.mjs && \
node scripts/bilingual-public-audit.mjs && \
node scripts/bilingual-hardcode-scan.mjs && \
node scripts/bilingual-founder-report.mjs
echo "CHECK 9: $?"

# 10. OAuth tests
npm --prefix services/api test
echo "CHECK 10: $?"

# Tổng hợp
for i in {1..10}; do echo "CHECK $i: $?"; done
```

#### P2.2 — Gitignore cleanup + untrack auth/out

```bash
git rm -r --cached apps/auth/out/ 2>/dev/null || true
git rm -r --cached apps/admin/out/ 2>/dev/null || true
git commit -m "chore: untrack build output directories"
```

#### P2.3 — Release Evidence Packet (output thật)

```bash
mkdir -p docs/release-evidence/2026-06-05

# Chạy và capture:
npm --prefix services/api run check > docs/release-evidence/2026-06-05/01-services-api-check.log 2>&1
apps/web/node_modules/.bin/next build > docs/release-evidence/2026-06-05/02a-web-build.log 2>&1
PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" apps/app/node_modules/.bin/next build > docs/release-evidence/2026-06-05/02b-app-build.log 2>&1
apps/admin/node_modules/.bin/next build > docs/release-evidence/2026-06-05/02c-admin-build.log 2>&1
apps/docs/node_modules/.bin/next build > docs/release-evidence/2026-06-05/02d-docs-build.log 2>&1
apps/auth/node_modules/.bin/next build > docs/release-evidence/2026-06-05/02e-auth-build.log 2>&1
npm run brand:lint > docs/release-evidence/2026-06-05/03-brand-lint.log 2>&1
node scripts/bilingual-founder-report.mjs > docs/release-evidence/2026-06-05/04-bilingual-audit.log 2>&1
npm --prefix services/api test > docs/release-evidence/2026-06-05/05-oauth-tests.log 2>&1

git add docs/release-evidence/2026-06-05/
git commit -m "evidence: release packet 2026-06-05 — all 10 checks PASS"
```

---

### PHASE P3 — SECURITY HARDENING

> **Exit P3 khi:** Không còn secret nào trong .env files được commit; CF Secrets Store active

---

#### P3.1 — CF Secrets Store (thay hardcode .env)

**KHÔNG dùng Vault dev mode cho production.**

```bash
# Cho mỗi Worker, set secrets qua wrangler:
CLOUDFLARE_ACCOUNT_ID=f3f9e76222dcb488d5e303e29e8ba192 \
  npx wrangler secret put OPENAI_API_KEY --name aiagent-iai-one-api

CLOUDFLARE_ACCOUNT_ID=f3f9e76222dcb488d5e303e29e8ba192 \
  npx wrangler secret put ANTHROPIC_API_KEY --name aiagent-iai-one-api

CLOUDFLARE_ACCOUNT_ID=f3f9e76222dcb488d5e303e29e8ba192 \
  npx wrangler secret put DB_PASSWORD --name omdala-api
```

**Rule bắt buộc:**
- `.env` files chỉ chứa non-secret config (URLs, feature flags)
- Secrets = CF Secrets Store ONLY
- Không commit `.env.production` bao giờ

#### P3.2 — SOPS cho local development

```bash
# Install:
brew install sops age

# Encrypt .env.local:
sops --encrypt --age $(cat ~/.config/sops/age/keys.txt | grep "public key" | awk '{print $4}') \
  .env.local > .env.local.enc

# Add to .gitignore:
echo ".env.local" >> .gitignore
echo "!.env.local.enc" >> .gitignore
```

#### P3.3 — Vault production mode (Phase 2 — Q3 2026)

```bash
# Deploy Vault trên VPS (mail.iai.one) chỉ sau khi Phase 1 CF Secrets ổn định:
docker run -d \
  --name vault \
  --cap-add=IPC_LOCK \
  -e VAULT_ADDR='http://0.0.0.0:8200' \
  -p 127.0.0.1:8200:8200 \
  -v /opt/vault/data:/vault/data \
  hashicorp/vault:latest server \
  -config /vault/config/config.hcl

# KHÔNG expose port 8200 ra ngoài. Vault chỉ accessible từ localhost/VPN.
```

---

### PHASE P4 — BACKUP & DISASTER RECOVERY

> **Exit P4 khi:** Backup chạy thành công + restore test PASS

---

#### P4.1 — PostgreSQL backup tự động

```bash
# Tạo script: /opt/backup/pg-backup.sh trên VPS mail.iai.one
cat << 'EOF' > /opt/backup/pg-backup.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/omdala_prod_${TIMESTAMP}.sql.gz"

pg_dump "postgresql://omdala_api@localhost:5432/omdala_prod" \
  | gzip > "$BACKUP_FILE"

# Upload lên R2:
npx wrangler r2 object put "iai-media/backups/pg/${TIMESTAMP}.sql.gz" \
  --file "$BACKUP_FILE" \
  --account-id "93112cc89181e75335cbd7ef7e392ba3"

rm "$BACKUP_FILE"
echo "Backup $TIMESTAMP OK"
EOF
chmod +x /opt/backup/pg-backup.sh

# Cron mỗi 6 giờ:
(crontab -l 2>/dev/null; echo "0 */6 * * * /opt/backup/pg-backup.sh >> /var/log/pg-backup.log 2>&1") | crontab -
```

#### P4.2 — Restore test (bắt buộc chạy ít nhất 1 lần)

```bash
# Download backup mới nhất:
LATEST=$(npx wrangler r2 object list "iai-media/backups/pg/" \
  --account-id "93112cc89181e75335cbd7ef7e392ba3" \
  | grep "sql.gz" | tail -1 | awk '{print $1}')

npx wrangler r2 object get "$LATEST" \
  --file /tmp/restore_test.sql.gz \
  --account-id "93112cc89181e75335cbd7ef7e392ba3"

# Restore vào DB test:
createdb omdala_restore_test 2>/dev/null || true
gunzip -c /tmp/restore_test.sql.gz | \
  psql "postgresql://omdala_api@localhost:5432/omdala_restore_test"

# Verify:
psql "postgresql://omdala_api@localhost:5432/omdala_restore_test" -c "\dt"
# Expected: 10 tables

# Cleanup:
dropdb omdala_restore_test
echo "RESTORE TEST: PASS"
```

---

### PHASE P5 — CI/CD (Tự động deploy từ git)

> **Exit P5 khi:** Push lên main → deploy tự động → không cần manual wrangler deploy

---

#### P5.1 — GitHub Actions cho omdala.com Pages

```yaml
# .github/workflows/deploy-web.yml
name: Deploy omdala.com
on:
  push:
    branches: [main]
    paths: ['apps/web/**', 'content/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm --prefix apps/web run build
        env:
          NEXT_PUBLIC_AUTH_API_BASE: ${{ secrets.AUTH_API_BASE }}
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: '93112cc89181e75335cbd7ef7e392ba3'
          command: pages deploy apps/web/.next --project-name=omdala-web --branch=main
```

#### P5.2 — GitHub Actions cho aiagent-iai-one API

```yaml
# .github/workflows/deploy-aiagent.yml
name: Deploy aiagent.iai.one
on:
  push:
    branches: [main]
    paths: ['apps/agent-api/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: 'f3f9e76222dcb488d5e303e29e8ba192'
          command: deploy --config apps/agent-api/wrangler.toml
```

---

### PHASE P6 — AGENT CONTROL PLANE (aiagent.iai.one thật)

> **Exit P6 khi:** Chat request → log vào PostgreSQL → quota từ DB → approval từ DB

---

#### P6.1 — Wire aiagent API quota check → PostgreSQL

Hiện tại `checkAndIncrementQuota()` dùng Durable Objects. Giai đoạn này add secondary write vào PostgreSQL để có audit trail:

```typescript
// apps/agent-api/src/index.ts — thêm sau quota check thành công:
await env.OMDALA_DB.prepare(`
  INSERT INTO model_usage (user_id, model, provider, tokens_in, tokens_out, cost_usd, period_day)
  VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)
  ON CONFLICT (user_id, model, period_day)
  DO UPDATE SET
    tokens_in = model_usage.tokens_in + EXCLUDED.tokens_in,
    tokens_out = model_usage.tokens_out + EXCLUDED.tokens_out,
    cost_usd = model_usage.cost_usd + EXCLUDED.cost_usd
`).bind(userId, model, provider, tokensIn, tokensOut, costUsd).run();
```

#### P6.2 — Approval gate live (từ OMCODE → API)

`commandPolicy.ts` đã classify commands ở desktop. Giai đoạn này: khi tier=`dangerous`, OMCODE gọi API endpoint trước khi execute:

```typescript
// apps/agent-api/src/index.ts — thêm endpoint:
// POST /v1/approval/request
// POST /v1/approval/respond (Founder/admin approve/reject)
```

---

## 4) MIGRATION PRIORITY (thứ tự app theo revenue/risk)

| # | App | Domain | Tại sao trước | Status mục tiêu P6 |
|---|-----|--------|---------------|-------------------|
| 1 | **aiagent.iai.one** | aiagent.iai.one | Revenue-critical, CF Worker live, quota real | Hyperdrive + usage log |
| 2 | **omdala.com** | omdala.com | 10 conditions gần xanh | Full 10/10 build gate |
| 3 | **OMCODE desktop** | local → github | App local, recovery pending | Committed + CI |
| 4 | **computer.iai.one** | computer.iai.one | API+Web rõ ràng | Build + deploy CI |
| 5 | **maytinhai.org** | maytinhai.org | D1 created (May 31) | Schema + API |
| 6 | **nhachung.org** | nhachung.org | NHACHUNG_DB có data | Schema verify |
| 7 | **tranhatam.com** | tranhatam.com | Brand personal | Last |

---

## 5) QUY TẮC VẬN HÀNH BẮT BUỘC (Dev Team)

### A. Không được tự report DONE

```
RULE: Mọi task chỉ được đánh DONE sau khi có output lệnh thật.
RULE: Không viết tay vào §5 Live Status. Chỉ paste output command.
RULE: Không claim build PASS nếu chưa chạy verify command với exit code.
```

### B. Thứ tự bắt buộc

```
P0 → P1 → P2 → P3 → P4 → P5 → P6
Không làm P3 trước khi P0 xong.
Không làm P6 trước khi Hyperdrive đã verified (P1).
```

### C. CF Secrets Store bắt buộc

```
RULE: Không push bất kỳ file nào chứa API key, DB password, JWT secret.
RULE: Dùng CF Secrets Store cho Workers production.
RULE: GitHub Actions Secrets cho CI/CD.
RULE: SOPS encrypt cho .env.local.
```

### D. Account isolation

```
RULE: Tranhatam66@gmail.com = omdala production + iai.one
RULE: Tranhatam@gmail.com = aiagent + trust + muonnoi + maytinhai
RULE: Không deploy omdala app vào account Tranhatam@gmail.com
RULE: Không deploy aiagent app vào account Tranhatam66@gmail.com
```

### E. Hyperdrive usage rule

```
RULE: Không public DNS cho PostgreSQL. Chỉ access qua Hyperdrive binding.
RULE: Không mở port 5432 ra internet.
RULE: DB password chỉ được lưu trong CF Secrets Store và VPS env.
```

### F. D1 usage rule

```
RULE: D1 chỉ cho lightweight metadata: config, registry, cache.
RULE: D1 không chứa user PII, payment data, conversation history.
RULE: User data = PostgreSQL via Hyperdrive.
```

---

## 6) LIVE STATUS (Supervisor cập nhật sau mỗi phase)

| Phase | Task | Status | Evidence | Updated |
|-------|------|--------|----------|---------|
| P0.1 | Fix model-router.ts TS errors | TODO | — | 2026-06-05 |
| P0.1 | Git rm apps/web/app/page.js | TODO | — | 2026-06-05 |
| P0.1 | apps/app Node 20 pin | TODO | — | 2026-06-05 |
| P0.2 | OMCODE git recovery | TODO | — | 2026-06-05 |
| P0.2 | OMCODE build #13 committed | TODO | — | 2026-06-05 |
| P0.3 | CF Inventory Map created | TODO | — | 2026-06-05 |
| P1.1 | PostgreSQL schema verified | TODO | — | 2026-06-05 |
| P1.2 | Schema deployed (10 tables) | TODO | — | 2026-06-05 |
| P1.3 | omdala-api Hyperdrive binding | TODO | — | 2026-06-05 |
| P1.4 | aiagent Hyperdrive binding | TODO | — | 2026-06-05 |
| P2.1 | 10 build conditions PASS | TODO | — | 2026-06-05 |
| P2.2 | auth/out untracked | TODO | — | 2026-06-05 |
| P2.3 | Release evidence packet | TODO | — | 2026-06-05 |
| P3.1 | CF Secrets Store (replace .env) | TODO | — | 2026-06-05 |
| P3.2 | SOPS local dev | TODO | — | 2026-06-05 |
| P4.1 | PostgreSQL backup cron | TODO | — | 2026-06-05 |
| P4.2 | Restore test PASS | TODO | — | 2026-06-05 |
| P5.1 | GitHub Actions omdala deploy | TODO | — | 2026-06-05 |
| P5.2 | GitHub Actions aiagent deploy | TODO | — | 2026-06-05 |
| P6.1 | aiagent usage → PostgreSQL | TODO | — | 2026-06-05 |
| P6.2 | Approval gate live (API) | TODO | — | 2026-06-05 |

**Status values:** `TODO | IN_PROGRESS | BLOCKED | DONE (evidence required) | FAIL`

---

## 7) REPORTING FORMAT (Supervisor → Founder)

Mỗi báo cáo sau phase completion:

```
1. Verdict:   GO / HOLD / BLOCKED
2. Commands:  [list lệnh đã chạy]
3. PASS:      [list items + output]
4. FAIL:      [list items + error output]
5. Blocked:   [cần Founder quyết định gì]
6. Score:     X/100
7. True state: [3-5 dòng thực tế, không claim]
8. Next:      [task cụ thể, file path, lệnh]
9. Hard stop: Yes/No + reason
```

---

## 8) FINAL SCORING RUBRIC (100/100)

| # | Gate | Weight | Cách verify | Status |
|---|------|--------|-------------|--------|
| 1 | CF Inventory Map exists + canonical account | 5 | `ls docs/CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md` | ❌ |
| 2 | services/api tsc --noEmit PASS | 10 | `npm --prefix services/api run check; echo $?` | ❌ |
| 3 | 5 Next.js builds PASS (evidence logs) | 15 | `docs/release-evidence/2026-06-05/02*.log` exits 0 | ❌ |
| 4 | bilingual 4 scripts PASS | 5 | `docs/release-evidence/2026-06-05/04-bilingual-audit.log` | ✅ |
| 5 | OAuth tests PASS | 5 | `npm --prefix services/api test; echo $?` | ✅ |
| 6 | Hyperdrive → omdala_prod active + schema verified | 15 | `SELECT count(*) FROM information_schema.tables` = 10 | ❌ |
| 7 | OMCODE build #13 committed | 5 | `git log --oneline -1 -- apps/desktop/src-tauri/Cargo.toml` | ❌ |
| 8 | CF Secrets Store (no .env secrets) | 10 | `git grep -r "API_KEY\s*=" --name-only | grep -v ".enc"` = empty | ❌ |
| 9 | PostgreSQL backup + restore test PASS | 10 | `docs/release-evidence/2026-06-05/pg-restore-test.log` | ❌ |
| 10 | CI/CD: git push → auto deploy PASS | 10 | GitHub Actions logs | ❌ |
| **TOTAL** | | **90/100** | | **10/100** |
| *Bonus* | Agent Control Plane live (P6) | +10 | chat log → PostgreSQL `agent_runs` entry | ❌ |

---

## 9) TIMELAPSE ESTIMATE

| Phase | Thời gian | Dependencies |
|-------|-----------|-------------|
| P0 | 4 giờ | None |
| P1 | 1 ngày | P0 done |
| P2 | 2 giờ | P0 done |
| P3 | 4 giờ | P1 done |
| P4 | 2 giờ | P1 done, VPS access |
| P5 | 4 giờ | P2 done, GitHub API token |
| P6 | 1 ngày | P1 + P5 done |
| **Total** | **~4 ngày** | Sequential |

---

## 10) CHANGE REQUESTS (chờ Founder duyệt)

| # | Request | Requestor | Date | Status |
|---|---------|-----------|------|--------|
| 001 | Upgrade Vite 5 → 6 cho apps/app (thay vì Node 20 pin) | Claude | 2026-06-05 | PENDING |
| 002 | Tạo dedicated omdala_dev database trên same VPS | Claude | 2026-06-05 | PENDING |
| 003 | Enable Cloudflare AI Gateway làm middleware cho aiagent | Claude | 2026-06-05 | PENDING |
