# Team 2 Bilingual Product Copy Registry - 2026-04-23

This registry is the Team 2 draft copy source for auth, dashboard, admin navigation, forms, empty states, and error states.

| Domain | Key | VI | EN | Source file | Status |
| --- | --- | --- | --- | --- | --- |
| Shared UI | `languageSelectorAria` | Bộ chọn ngôn ngữ | Language selector | `packages/ui/src/copy/shared-ui-copy.ts` | implemented |
| Shared UI | `comingSoon` | Sắp ra mắt | Coming soon | `packages/ui/src/copy/shared-ui-copy.ts` | implemented |
| Shared UI | `emptyState.title` | Chưa có dữ liệu | No data yet | `packages/ui/src/copy/shared-ui-copy.ts` | copy_ready |
| Shared UI | `emptyState.body` | Mục này sẽ hiển thị khi có dữ liệu. | This section will appear when data becomes available. | `packages/ui/src/copy/shared-ui-copy.ts` | copy_ready |
| Shared UI | `genericError.title` | Đã xảy ra lỗi | Something went wrong | `packages/ui/src/copy/shared-ui-copy.ts` | copy_ready |
| Shared UI | `genericError.body` | Vui lòng thử lại sau ít phút. | Please retry in a few moments. | `packages/ui/src/copy/shared-ui-copy.ts` | copy_ready |
| Auth | `authHostLoginPage.title` | Đăng nhập an toàn cho các bề mặt vận hành của OMDALA. | Secure login for OMDALA operator surfaces. | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `authHostLoginPage.body` | Tiếp tục đăng nhập không mật khẩu trên host xác thực chuyên biệt. Cookie phiên được áp dụng cho toàn bộ subdomain của OMDALA. | Continue with passwordless sign-in on the dedicated auth host. Session cookies are scoped for OMDALA subdomains. | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.verifying` | Đang xác thực liên kết đăng nhập... | Verifying your sign-in link... | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.verifyError` | Không thể xác thực liên kết đăng nhập. | Unable to verify your sign-in link. | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.verified` | Liên kết đăng nhập hợp lệ. Đang chuyển vào ứng dụng... | Sign-in link accepted. Redirecting into the app... | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.invalidLink` | Liên kết đăng nhập không hợp lệ hoặc đã hết hạn. | The sign-in link is invalid or expired. | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.sendError` | Không gửi được liên kết đăng nhập. | Unable to send your sign-in link. | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.email` | Email công việc | Work email | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.redirect` | Điều hướng sau đăng nhập | Redirect after sign-in | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `magicLinkForm.send` | Gửi liên kết đăng nhập | Send sign-in link | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `appLoginPage.openAuth` | Mở auth.omdala.com | Open auth.omdala.com | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `appSignupPage.title` | Bắt đầu một tài khoản vận hành OMDALA mới. | Start a new OMDALA operator account. | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `accessRequestForm.sendError` | Không gửi được yêu cầu truy cập. | Unable to submit the access request. | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `accessRequestForm.role` | Vai trò chính | Primary role | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `accessRequestForm.nodeName` | Tên nút đầu tiên | First node name | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Auth | `accessRequestForm.note` | Ghi chú bối cảnh | Context note | `packages/ui/src/copy/auth-copy.ts` | implemented |
| Dashboard | `layout.productSurface` | Bề mặt sản phẩm | Product Surface | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `layout.navLabels.Dashboard` | Bảng điều khiển | Dashboard | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `dashboard.eyebrow` | Bảng điều khiển vận hành | Operations dashboard | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `dashboard.coreWorkspace.title` | Khu vực làm việc cốt lõi | Core workspace | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `dashboard.coreWorkspace.openNodes` | Mở nút | Open nodes | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `dashboard.coreWorkspace.openResources` | Mở tài nguyên | Open resources | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `dashboard.coreWorkspace.openTrust` | Mở niềm tin | Open trust | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `dashboard.coreWorkspace.openOffers` | Mở đề nghị | Open offers | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `dashboard.coreWorkspace.openRequests` | Mở nhu cầu | Open requests | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `trustPage.title` | Không gian vận hành niềm tin | Trust operations workspace | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `trustPage.proofQueueTitle` | Hàng chờ rà duyệt bằng chứng | Proof review queue | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard | `trustPage.nextActionsTitle` | Hành động nên làm tiếp | Recommended next actions | `apps/app/lib/bilingual-copy.ts` | implemented |
| Dashboard (enum) | `userRole.*` | Chuyên gia / Chủ thể đón tiếp / Cộng đồng / Doanh nghiệp / Quản trị / Hệ thống | Expert / Host / Community / Business / Admin / System | `apps/app/lib/vi-labels.ts` | implemented |
| Dashboard (enum) | `status.*` (`node/resource/request/verification`) | Nháp / Đang mở / Đang chờ duyệt... | Draft / Published / Pending... | `apps/app/lib/vi-labels.ts` | implemented |
| Admin nav | `layout.nav.overview` | Tổng quan | Overview | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin nav | `layout.nav.providers` | Nhà cung cấp | Providers | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin nav | `layout.nav.nodes` | Nút | Nodes | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin nav | `layout.nav.offers` | Đề nghị | Offers | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin nav | `layout.nav.requests` | Nhu cầu | Requests | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin nav | `layout.nav.proofs` | Bằng chứng | Proofs | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin nav | `layout.nav.verifications` | Xác minh | Verifications | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin moderation | `overview.openCases` | Case đang mở | Open cases | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin moderation | `overview.highSeverity` | Mức nghiêm trọng cao | High severity | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin moderation | `overview.currentQueue` | Hàng chờ hiện tại | Current queue | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin moderation | `overview.severity` | Mức độ | Severity | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin moderation | `overview.action` | Hành động | Action | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin forms/labels | `offers.minimumTrust` | Niềm tin tối thiểu | Minimum trust | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin forms/labels | `requests.urgency` | Mức khẩn | Urgency | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Admin forms/labels | `proofs.verification` | Xác minh | Verification | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Error state | `layout.adminRoleRequired` | Yêu cầu vai trò quản trị | Admin role required | `apps/admin/app/lib/admin-copy.ts` | implemented |
| Error state | `layout.restrictedCopy` | Khu vực này dành cho các vai trò kiểm duyệt và vận hành... | This surface is reserved for moderation and operations roles... | `apps/admin/app/lib/admin-copy.ts` | implemented |

## Product-Critical State Coverage

- Auth login/magic-link verification states: registered in `AUTH_COPY.magicLinkForm`.
- Auth access-request submit states: registered in `AUTH_COPY.accessRequestForm`.
- Dashboard session-gate, trust queue, and action labels: registered in `APP_COPY`.
- Admin navigation and moderation status labels: registered in `ADMIN_COPY`.
- Shared reusable UI fallback empty/error labels: registered in `SHARED_UI_COPY`.

## Remaining Copy to Register (next pass)

- Dashboard entity create/edit forms for `nodes/offers/requests/resources`.
- Profile/settings inline copy blocks (`apps/app/app/(dashboard)/profile/**`, `settings/**`).
- Legacy app auth shell copy in `apps/app/app/sign-in/page.js` and `apps/app/components/magic-link-form.js`.
- Provider observability low-level labels in `apps/admin/app/providers/ProviderObservabilityDashboard.tsx`.
