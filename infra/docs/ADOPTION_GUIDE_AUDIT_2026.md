# OMDALA Audit-Infra Branch Adoption Guide
## Branch: `audit-omdala-infra` | Commit: `0b8c73a..HEAD`

---

## TL;DR cho từng team

| Team | Action cần làm | Files cần đọc |
|------|---------------|---------------|
| **DevOps / SRE** | Review infra/ services (Docker, Compose, TF, scripts) | `infra/README.md`, `infra/docs/DEPLOYMENT.md` |
| **Backend / API** | Pull test fixes, chạy `node --test` | `infra/services/api-gateway/src/__tests__/` |
| **Worker / Jobs** | Pull handler mới, chạy worker tests | `infra/services/worker/src/jobs/` |
| **Frontend / Web** | Fix `page.js` duplicate, verify Next.js build | `apps/web/app/page.js` (đã xóa) |
| **AI / Core** | Review model-router type guards | `packages/core/src/model-router.ts` |
| **Content / Legal** | Không có breaking change | — |

---

## 1. DevOps / SRE Team

### Đã merge vào branch:
- **Docker Compose**: PostgreSQL + Valkey + MinIO + Keycloak + Uptime Kuma + Backup
- **Unit tests**: API Gateway 23/23 PASS, Worker 10/10 PASS
- **Terraform**: `infra/tf/main.tf` — R2, KV, D1, Pages, Workers, Hyperdrive, DNS
- **Scripts**:
  - `scripts/bootstrap.sh` — server bootstrap
  - `scripts/migrate.sh` — DB migration runner
  - `scripts/d1-export.sh` — D1 inventory export
  - `scripts/d1-to-postgres.sh` — D1 → PostgreSQL migration
  - `scripts/cf-connection-test.js` — CF connectivity check
- **Backup strategy**: `backup/backup-db.sh` + `backup/Dockerfile`
- **n8n workflows**: backup-check, cost-alert, incident-create
- **Log aggregation**: Fluentd + Loki configs

### Steps để áp dụng:
```bash
git fetch origin
git checkout audit-omdala-infra
# Local dev
cd infra && docker compose up -d
# Run tests
cd infra/services/api-gateway && npm test
cd infra/services/worker && npm test
```

### Production checklist:
- [ ] Update `.env` từ `.env.example`
- [ ] Set `CLOUDFLARE_API_TOKEN` cho Terraform
- [ ] Run `terraform plan` trong `infra/tf/`
- [ ] Test backup script trên staging
- [ ] Import n8n workflows (JSON files trong `infra/n8n/`)

---

## 2. Backend / API Team

### Breaking changes:
- `pg.query` trong routes giờ import từ `lib/db.js` (shared pool)
- Route paths đã fix: prefix không còn duplicate (`/tasks` → `/` khi register với prefix)
- `health.js` lazy-init Redis để testable

### Migration steps:
```bash
git pull origin audit-omdala-infra
cd infra/services/api-gateway
npm install  # cài @fastify/swagger + swagger-ui mới
npm test     # expect 23/23 PASS
```

### Swagger docs:
- Sau start server, truy cập `/docs` để xem OpenAPI UI
- Schema cơ bản cho `/health` và `/health/deep`

---

## 3. Worker / Jobs Team

### New job handlers:
| Job | File | Mô tả |
|-----|------|-------|
| `deploy` | `worker/src/jobs/deploy.js` | SSH/VPS + CF Pages/Worker deploy |
| `db-query` | `worker/src/jobs/db-query.js` | Safe SQL với whitelist |
| `code-review` | `worker/src/jobs/code-review.js` | AI review + GitHub PR comment |

### Migration steps:
```bash
git pull origin audit-omdala-infra
cd infra/services/worker
npm test  # expect 10/10 PASS
```

---

## 4. Frontend / Web Team

### Breaking changes:
- **Xóa `apps/web/app/page.js`** — file trùng lặp, Next.js dùng `page.tsx`
- **Xóa `apps/app/app/page.js`** — tương tự

### Migration steps:
```bash
git pull origin audit-omdala-infra
# Verify builds
cd apps/web && npm run build
cd apps/app && npm run build
```

### Nếu build fail:
Kiểm tra xem có `page.js` nào còn sót không:
```bash
find apps/ -name "page.js" -not -path "*/node_modules/*"
# Nếu còn → xóa hoặc rename thành .tsx
```

---

## 5. AI / Core Team

### Changes:
- `packages/core/src/model-router.ts` — thêm 5 runtime type guards:
  1. `callDeepSeek`: kiểm tra `config.apiKey`
  2. `callCloudflare`: kiểm tra `config.apiKey`
  3. `callLocal`: kiểm tra `request.messages` là array non-empty
  4. `callLocal`: sanitize `request.temperature` (number, not NaN)
  5. `callLocal`: sanitize `request.maxTokens` (number > 0)

### Migration steps:
```bash
git pull origin audit-omdala-infra
cd packages/core
npx tsc --noEmit  # expect 0 errors
```

---

## 6. Content / Legal / QA Team

- Không có breaking change liên quan đến content
- Bilingual scripts (`scripts/audit-*.mjs`) vẫn hoạt động như cũ
- QA có thể chạy `npm test` trong `infra/services/` để verify

---

## Rollback Plan

Nếu merge gây lỗi:
```bash
git revert HEAD  # revert commit mới nhất
git push origin main
# Hoặc revert toàn bộ branch:
git checkout main
git reset --hard origin/main-pre-merge
```

## Support

Mở issue với tag `audit-infra-merge` nếu team gặp lỗi khi áp dụng.
