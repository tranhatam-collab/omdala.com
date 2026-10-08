# GÓI HOÀN THIỆN INFRA VÀ GỠ CHẶN LIÊN TEAM

**Ngày khóa bằng chứng:** 2026-08-14
**Repo:** `git@github.com:tranhatam-collab/omdala.com.git`
**Checkout đã audit:** `.team1/integration-20260809`
**Branch:** `OMCODE/infra-completion-cross-team-20260814`
**HEAD trước patch:** `1c338b835e05f631c7b2bb9e5d8f3fec2028de75`
**Trạng thái phát hành:** `NO-GO`

Packet này là runbook thực thi, không phải bằng chứng production. Mọi claim runtime từ
Team AI Provider được giữ ở `REPORTED_UNVERIFIED` cho đến khi có probe độc lập tại đúng
deployment ID. Không có secret, deploy, migration remote, DNS, hay dữ liệu production nào
được thay đổi trong lúc tạo packet.

## 1. Ground truth đã kiểm tra

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Checkout integration có HEAD hợp lệ | `VERIFIED_CURRENT` | `1c338b835e05f631c7b2bb9e5d8f3fec2028de75` |
| HEAD thuộc `origin/main` | `BLOCKED` | `git merge-base --is-ancestor HEAD origin/main` trả `1` |
| Folder cha là release source | `CONTRADICTED` | Folder cha có HEAD hỏng/zero và source untracked; không dùng để build hoặc deploy |
| `omdala-api` runtime | `VERIFIED_CURRENT` | Cloudflare Worker, account trong config là `f3f9e76222dcb488d5e303e29e8ba192` |
| `om-ai.omdala.com` runtime | `VERIFIED_CURRENT` | Cloudflare Pages qua `pages_build_output_dir`, không phải Worker |
| API persistence contract | `VERIFIED_CURRENT` | Source sử dụng PostgreSQL qua `DATABASE_URL` hoặc Hyperdrive |
| Hyperdrive production | `BLOCKED` | Chưa có `[[hyperdrive]]` trong `services/api/wrangler.toml` |
| Hyperdrive staging | `BLOCKED` | Chưa có `[[env.staging.hyperdrive]]`; binding môi trường phải khai báo riêng |
| D1 staging inventory | `VERIFIED_HEAD_ONLY` | Ba database ID có trong `infra/d1/wrangler.toml`; chưa probe table/migration remote |
| Release toolchain | `VERIFIED_CURRENT` | Re-run bằng Node `22.22.3`, pnpm `9.15.0` đúng engine/pin của repo |
| `api.omdala.com/health` | `CONTRADICTED` | Read-only probe trả HTTP `522`; không có runtime identity |
| Worker secret-name audit | `BLOCKED` | Wrangler chưa xác thực; không có names-only receipt |
| D1 staging remote audit | `BLOCKED` | Wrangler chưa xác thực; chưa đọc được table count |
| AI Provider public health | `VERIFIED_CURRENT` | Gateway trả JSON `200`, status `ok`; không có release/deployment identity |
| owner-os public health | `VERIFIED_CURRENT` | Trả JSON `200`, status `ready`; không có release/deployment identity |
| AI Provider source/deep-health claim | `REPORTED_UNVERIFIED` | Public 200 không chứng minh exact source, authenticated deep health hoặc contract E2E |

## 2. Điều chỉnh bắt buộc so với packet cũ

1. Không thêm `RELEASE_SHA`/`DEPLOYMENT_ID` vào mọi `wrangler.toml` một cách cơ học. Worker nhận identity tại deploy; Pages dùng `CF_PAGES_COMMIT_SHA` do Pages cung cấp.
2. Không xem D1 là data binding của `omdala-api`. API hiện dùng driver `pg`, nên release gate yêu cầu Hyperdrive production và staging.
3. Không tuyên bố `api-staging.omdala.com` đã tồn tại. URL health phải được cấu hình trong GitHub protected environment bằng `OMDALA_API_HEALTHCHECK_URL` và được probe sau deploy.
4. Không dùng folder cha bị hỏng làm nguồn release. Mọi patch/receipt trong packet này thuộc checkout integration nêu ở đầu tài liệu.
5. Không coi các workflow dưới `infra/.github/workflows/` là workflow GitHub đang hoạt động trong monorepo. Nếu định nâng chúng lên root, phải sửa auto-deploy, action không pin SHA, `StrictHostKeyChecking=no`, và receipt thiếu exact SHA trước.

## 3. Ledger blocker B0-B10

| ID | Việc phải hoàn thành | Owner | Mutation | Trạng thái hiện tại | Gỡ chặn |
|---|---|---|---|---|---|
| B0 | Chọn candidate có HEAD hợp lệ, reconcile với `main`, khóa exact SHA | Team 1 | Source | `BLOCKED` | Tất cả team |
| B1 | API identity contract và `/health/deep` | Team 1 + Team 2 | Source | `VERIFIED_WORKTREE_ONLY` | Release receipt |
| B2 | Chọn/provision Hyperdrive ID cho prod và staging | Founder + Team 1 + Team 2 | Cloud control plane | `BLOCKED` | API data plane |
| B3 | Khôi phục API production 522; provision staging Worker, route và protected env URL | Founder + Team 1 | Cloud deploy/DNS | `BLOCKED` | Runtime/E2E/rollback |
| B4 | Secret-name hygiene sweep, canonical-name diff và remediation | Founder + Team 1 + owner repo | Secret read/mutation | `BLOCKED_AUTH` | Auth/AI Provider |
| B5 | Xác minh service-key admin contract và cấp key tenant-scoped | Founder + AI Provider lane | Credential mutation | `BLOCKED` | owner-os authenticated E2E |
| B6 | Main ancestry, environment, identity, deep-health CI gate | Team 1 | Source | `VERIFIED_WORKTREE_ONLY` | Controlled release |
| B7 | D1 staging migration inventory và remote table receipt | Founder + Team 2 | Remote data | `BLOCKED_AUTH` | D1 consumers |
| B8 | Backup/restore drill trên scratch target | Founder + Team 1 + Team 4 | Controlled staging data | `NOT_CHECKED` | DR gate |
| B9 | Chọn canonical Cloudflare account cho API/data/Terraform | Founder | Decision | `BLOCKED` | Hyperdrive/Terraform |
| B10 | Independent exact-SHA verification và sign-off | Team 4, nhận input Team 1-3 | Read-only | `BLOCKED` | Final go/no-go |

## 4. Source patch đã chuẩn bị

### B1: Release identity và deep health

Các file source đã chuẩn bị trong worktree:

- `services/api/src/contracts.ts`: thêm `RELEASE_SHA`, `DEPLOYMENT_ID`.
- `services/api/src/index.ts`: `/health` công bố identity; `/health/deep` chạy `SELECT 1`, trả `503` nếu identity hoặc database chưa sẵn sàng.
- `services/api/src/health.test.ts`: test missing identity, exact identity và fail-closed database.
- `services/api/wrangler.toml`: tách `ENVIRONMENT` production/staging; chưa tự điền Hyperdrive ID.

Receipt source hiện tại:

```text
Node / pnpm                          22.22.3 / 9.15.0
pnpm --filter @omdala/api test       PASS: 9 files, 50 tests
pnpm --filter @omdala/api run check PASS
wrangler deploy --dry-run prod      PASS
wrangler deploy --dry-run staging   PASS
```

Đây là `VERIFIED_WORKTREE_ONLY`, chưa phải deployed evidence.

### B6: Release workflow fail-closed

`.github/workflows/deploy.yml` đã chuẩn bị các gate:

- Checkout full history và khóa exact SHA.
- Production chỉ đi tiếp nếu SHA là ancestor của `origin/main`.
- Chọn `--env staging` hoặc `--env ""` rõ ràng; không deploy nhầm môi trường.
- Yêu cầu Hyperdrive đúng môi trường trước deploy.
- Inject exact `RELEASE_SHA` và `DEPLOYMENT_ID` bằng Wrangler CLI.
- Sau deploy gọi URL trong protected environment và chỉ PASS nếu identity khớp cùng database `ok`.
- Ghi receipt không chứa secret vào `$GITHUB_STEP_SUMMARY`.

## 5. Detector read-only

Full local release matrix đã được phục hồi thành command runnable:

```bash
pnpm release:verify
```

Command chạy toàn matrix, không deploy, tiếp tục sau từng lỗi và ghi JSON receipt vào `/tmp`.
Remote read-only probes chỉ được thêm khi đặt `RELEASE_VERIFY_REMOTE=true`.

Chạy source audit ở bất kỳ máy nào có checkout:

```bash
pnpm infra:audit:source
```

Chạy remote audit chỉ đọc khi Founder cấp token read-only phù hợp:

```bash
OMDALA_API_PRODUCTION_HEALTH_URL=https://<verified-prod-host> \
OMDALA_API_STAGING_HEALTH_URL=https://<verified-staging-host> \
pnpm infra:audit:remote -- --output /tmp/omdala-infra-remote-receipt.json
```

Detector chỉ:

- Đọc Git/config/source.
- List **tên** secret; không lấy hoặc in value/length.
- Query metadata table count của D1 staging.
- Fetch JSON health endpoint.
- Không deploy, không put/delete secret, không apply migration, không sửa DNS.

Exit code `2` có nghĩa audit tìm thấy `BLOCKED`/`CONTRADICTED`; không được đổi thành PASS bằng cách bỏ gate.

Receipt read-only hiện tại: `infra/docs/evidence/INFRA_READONLY_REMOTE_RECEIPT_2026-08-14.json`.
Receipt xác nhận API production `522`, hai external public health JSON `200` nhưng thiếu
identity, và Cloudflare metadata probes bị chặn bởi `authentication_required`.

Incident triage: `infra/docs/evidence/API_OMDALA_522_INCIDENT_TRIAGE_2026-08-14.md`.
Edge trace `200` nhưng application health `522`; source route đã biến mất so với commit
bootstrap. Root cause giữ ở `LIKELY_CONFIG_DRIFT_NOT_CONFIRMED` đến khi đọc được dashboard.

## 6. Trình tự thực thi

### Wave 0: Không cần quyền production

1. Team 1 review patch B1/B6 và machine-readable task manifest.
2. Rebase/merge candidate lên `main`; chạy lại source audit tại exact candidate SHA.
3. Team 2 xác nhận API tiếp tục dùng PostgreSQL/Hyperdrive; không gắn D1 trực tiếp vào driver `pg`.
4. Team AI Provider cung cấp source SHA, config path, deep-health schema và admin service-key schema từ repo sở hữu.
5. Team 4 review độc lập diff và negative tests.

### Wave 1: Founder approval window

1. Founder quyết định B9 Cloudflare account và cấp session/token read-only tối thiểu cho audit.
2. Team 1 điều tra/khôi phục API production `522` theo incident runbook, không redeploy mù.
3. Team 1 provision Hyperdrive production/staging theo account đã chọn.
4. Team 1 tạo staging route và protected environment variable.
5. Team 1 chạy lại remote read-only detector; Founder chỉ duyệt remediation sau names-only receipt.
6. Team 2 apply D1 staging migrations theo scope đã duyệt và xuất table-count receipt.
7. AI Provider lane tạo tenant-scoped key theo contract đã review; key chỉ đi qua secret store.

### Wave 2: Staging verification

1. Team 1 deploy exact SHA vào staging bằng workflow đã bảo vệ.
2. Team 2 chạy API/auth/data migrations và isolated E2E.
3. AI Provider lane chạy authenticated provider E2E qua canonical service binding.
4. Team 3 chạy browser/mobile và xác minh Pages commit SHA riêng.
5. Team 1 + Team 4 chạy rollback và backup/restore scratch drill.
6. Team 4 gom receipt độc lập và phát `GO_RECOMMENDED` hoặc `HOLD`.

### Wave 3: Production

Chỉ Founder được quyết định production sau khi B0-B10 có receipt. CI xanh, HTTP 200,
hoặc một packet hoàn chỉnh không tự tạo quyền release.

## 7. Receipt bắt buộc

| Gate | Receipt tối thiểu | Người xác minh độc lập |
|---|---|---|
| Source | repo URL, branch, exact SHA, clean tree, SHA on main | Team 4 |
| Build/test | command, exit code, Node/pnpm versions, test count | Team 4 |
| Artifact | Wrangler dry-run summary và config digest | Team 4 |
| Deploy | Cloudflare deployment ID gắn exact SHA | Team 4 |
| Runtime | `/health/deep` JSON khớp SHA/deployment ID, database `ok` | Team 4 |
| D1 | migration list và table count từng DB staging | Team 4 |
| Secret hygiene | names-only list, không whitespace/canonical duplicate | Team 4 |
| AI Provider | authenticated JSON contract, owner-os consumer E2E | Team 4 |
| DR | backup timestamp, scratch restore, row/schema parity, cleanup | Team 4 |
| UX | desktop/mobile crawl tại exact deployment | Team 4 |
| Decision | Team 1-3 sign-off, Team 4 verdict, Founder decision | Founder |

## 8. Điều cấm

- Không dùng secret value trong chat, log, commit hoặc receipt.
- Không tạo service key trước khi source contract và scope được review.
- Không sửa/delete secret production chỉ từ narrative trailing-space.
- Không apply D1 migration trước backup, target-ID check và Founder approval.
- Không deploy SHA ngoài `main` lên production.
- Không dùng Pages 200 làm bằng chứng Worker/API khỏe.
- Không tự sign-off phần mình vừa triển khai.

## 9. Go/no-go hiện tại

**`NO-GO`**. Source patch B1/B6 đã test cục bộ, nhưng candidate chưa thuộc `main`,
API production đang `522`, Hyperdrive chưa provision, Worker/D1 metadata bị chặn bởi auth,
authenticated provider E2E và DR chưa chạy, và chưa có independent sign-off. Các team có thể
bắt đầu ngay theo task board, nhưng không team nào được tuyên bố production ready ở trạng thái này.

## 10. Tài liệu nền tảng chính thức

- Cloudflare Wrangler deploy flags: <https://developers.cloudflare.com/workers/wrangler/commands/workers/>
- Cloudflare Wrangler environments và non-inheritable bindings: <https://developers.cloudflare.com/workers/wrangler/environments/>
- Cloudflare Pages build variables, gồm `CF_PAGES_COMMIT_SHA`: <https://developers.cloudflare.com/pages/configuration/build-configuration/>
