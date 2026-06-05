# omdala.com — Dev Log

Cập nhật mới nhất ở đầu file.

---

## 2026-05-18 — Google button live trên auth.omdala.com

### Đã làm
- **Google sign-in button** — inject trực tiếp vào pre-built static export `apps/auth/out/login/index.html` trước `<!--$!-->` Suspense boundary.
- **Deployed đúng branch** — `--branch production` trên project `omdala-auth` (account 93112cc). Lần trước deploy nhầm `--branch main` tạo Preview deployment, custom domain `auth.omdala.com` chỉ serve `production` branch.
- Button trỏ tới `https://api.omdala.com/v1/auth/google/start`.

### Secrets trên `omdala-api` worker
| Secret | Status |
|--------|--------|
| MAIL_API_KEY | ✅ set (trước) |
| GOOGLE_CLIENT_ID | ✅ set |
| GOOGLE_CLIENT_SECRET | ✅ set |
| GOOGLE_REDIRECT_URI | ✅ `https://api.omdala.com/v1/auth/google/callback` |

### Google Console
- Redirect URI `https://api.omdala.com/v1/auth/google/callback` ✅ đã đăng ký (IAI ONE client URI #9, added 2026-05-18).

### Email flows
| Flow | Route | Status |
|------|-------|--------|
| Magic link | `/v1/auth/magic-link/request` | ✅ Live |
| Google OAuth | `/v1/auth/google/start` | ✅ Button live trên /login |

### Còn lại
- Test end-to-end Google OAuth flow trên `auth.omdala.com`.
