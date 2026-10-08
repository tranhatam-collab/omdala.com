# INFRA CROSS-TEAM EXECUTION BOARD

**Verdict hiện tại:** `NO-GO`
**Manifest máy đọc:** `docs/governance/INFRA_CROSS_TEAM_TASK_MANIFEST_2026-08-14.json`
**Runbook Infra:** `infra/docs/INFRA_COMPLETION_CROSS_TEAM_UNBLOCK_PACKET_2026-08-14.md`

**Runtime red alert:** `api.omdala.com/health` trả HTTP `522` trong read-only probe hiện tại.
Gateway AI Provider và owner-os trả JSON `200`, nhưng cả hai không có release SHA/deployment ID.
Cloudflare secret-name và D1 metadata probes đang `BLOCKED` vì Wrangler chưa xác thực.

Team AI Provider là lane phối hợp với Team 2/Core API, không tự thay Team 1 trong release
governance và không tự sign-off runtime mà lane đó vừa sửa.

## Critical path

```text
INFRA-001 candidate/main
  -> INFRA-002 source gates
  -> INFRA-003 Hyperdrive/account decision
  -> INFRA-004 staging
  -> AIP-003 service key + DATA-002 D1 staging
  -> AIP-004 provider E2E + WEB-002 browser/mobile
  -> DR-001 rollback/restore
  -> QA-001 independent verdict
  -> REL-001 Founder go/no-go
```

## Team 1: Infra, canonical source, SRE, release

**Làm ngay:** `INFRA-001`, `INFRA-002`.

- Reconcile nhánh integration với `main`; không dùng folder cha có Git identity hỏng.
- Review và merge identity/deep-health/release workflow patch.
- Điều tra API production `522` theo incident runbook trước mọi release action.
- Chuẩn bị account/Hyperdrive decision packet, staging route, protected environment.
- Chạy detector read-only trước mọi secret remediation.
- Tổ chức DR drill và xuất receipt, nhưng không tự phê duyệt production.

**Tin nhắn giao việc:**

> Team 1 nhận `INFRA-001..006` và `DR-001`. Bắt đầu bằng exact candidate SHA trên `main`, review patch B1/B6, sau đó trình Founder account/Hyperdrive/staging decision. Không deploy hoặc sửa secret trước approval. Receipt phải có exact SHA, deployment ID và deep-health read-back.

## Team 2: Core API, identity, data, billing

**Làm ngay:** `DATA-001`, phối hợp review `INFRA-002`.

- Khóa kiến trúc PostgreSQL/Hyperdrive cho API.
- Map rõ service nào dùng ba D1 database; không đấu D1 vào code `pg`.
- Chuẩn bị migration order, tenant-isolation test, rollback và table-count receipt.
- Sau staging, chạy API/auth/data isolated E2E.

**Tin nhắn giao việc:**

> Team 2 nhận `DATA-001..002` và đồng sở hữu acceptance B1/B2. Xác minh API dùng Hyperdrive, lập D1 consumer map và migration plan trước khi xin apply remote. Chỉ báo PASS khi staging exact deployment chạy migration/tenant isolation với receipt.

## Team AI Provider lane

**Làm ngay:** `AIP-001`, `AIP-002`.

- Cung cấp repo/source/config/deployment identity của gateway và owner-os.
- Chứng minh deep-health/admin-key contract từ source; không dựa vào endpoint đoán.
- Chuẩn hóa service binding và secret **name** ở source.
- Sau Founder approval, chạy authenticated E2E trên staging và negative tests.

**Tin nhắn giao việc:**

> AI Provider lane nhận `AIP-001..004`. Giao exact gateway/owner-os SHA, deployment ID, deep-health schema và service-key admin contract trước. Không tạo key hoặc sửa production secret. Sau staging/approval, xuất authenticated JSON E2E receipt cho cả success, bad key và wrong HTML host.

## Team 3: Web, product, verticals

**Làm ngay:** `WEB-001`.

- Với `om-ai` Pages, dùng `CF_PAGES_COMMIT_SHA` làm identity receipt.
- Lập dependency map từ từng public surface tới Worker/API thực.
- Chuẩn bị browser/mobile matrix và trạng thái lỗi rõ ràng khi API/AI unavailable.
- Chưa gọi HTTP 200/Pages render là go-live proof.

**Tin nhắn giao việc:**

> Team 3 nhận `WEB-001..002`. Khóa Pages commit SHA, mapping frontend-to-runtime và test matrix ngay. Khi staging sẵn sàng, chạy desktop/mobile journeys tại exact URLs, gồm degraded API/AI states; giao trace/screenshot và không tự chốt release.

## Team 4: Independent QA, security, release recommendation

**Làm ngay:** review source diff/negative cases; runtime gate chờ dependencies.

- Không dùng receipt do implementer tự xác nhận làm bằng chứng độc lập duy nhất.
- Re-run source/test/build tại exact candidate SHA.
- Re-probe staging identity, content type, database, auth, AI Provider, browser, DR.
- Phát duy nhất `GO_RECOMMENDED` hoặc `HOLD`; không deploy.

**Tin nhắn giao việc:**

> Team 4 nhận `QA-001`. Review patch ngay nhưng giữ runtime items `BLOCKED` đến khi có exact staging deployment. Re-run độc lập mọi gate, phân loại claim theo evidence layer, và chỉ phát `GO_RECOMMENDED` hoặc `HOLD` gắn cùng SHA/deployment set.

## Founder

**Cần quyết định:** account canonical, Hyperdrive, staging/DNS, secret remediation,
D1 remote migration, tenant key issuance, DR access và production release.

**Tin nhắn quyết định:**

> Founder chưa cần nhập secret vào chat. Vui lòng duyệt theo decision packet có target account/resource ID, mutation, rollback và verifier. Production chỉ được GO sau `REL-001`: sign-off Team 1-3, verdict độc lập Team 4 và toàn bộ receipt cùng exact SHA/deployment set.

## Quy tắc cập nhật board

- Mọi task chuyển trạng thái trong JSON manifest, kèm link receipt; không chỉ sửa prose.
- `VERIFIED_WORKTREE_ONLY` không được đổi thành `VERIFIED_CURRENT` trước deploy/read-back.
- Claim external giữ `REPORTED_UNVERIFIED` đến khi Team 4 re-probe.
- Bất kỳ SHA/deployment mismatch nào trả toàn bộ release về `HOLD`.
