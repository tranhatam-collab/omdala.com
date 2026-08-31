# App Session Policy

## Goals

- Keep session handling consistent between web and app.
- Support magic-link auth with optional session tokens for app.
- Allow revocation and logout with minimal state leakage.

## Session tokens

- App receives a short-lived magic-link token from backend.
- After verifying link, backend issues a session token (`access_token`) with expiration (e.g., 1 hour) and optional refresh token.
- Tokens are bearer tokens and must be sent via `Authorization: Bearer <token>` header.

## Storage rules

- Store access token in secure storage (Keychain on iOS, Keystore on Android).
- Never store tokens in plaintext or logs.
- Refresh token stored only if multi-session support is needed; otherwise rely on repeated magic-link sign-in.

## Refresh behavior

- If backend issues refresh tokens, app should refresh proactively when access token expires (e.g., 5 minutes before expiry).
- On refresh failure or revoked session, clear tokens and show sign-in screen.

## Logout

- Clear access and refresh tokens from secure storage.
- Call backend revoke endpoint (`/v1/auth/logout` or future endpoint) if available.

## Telemetry

- Attach request ID and session ID on API calls for tracing (when available in response `meta`).
- Log only high-level events (sign-in success, logout) without tokens.

## Next steps

- Backend to expose session/refresh endpoints for app.
- App to implement session manager module using this policy.

## Implementation status

- Implemented in `app/src/session/sessionStore.tsx` with secure token persistence.
- Access token is attached through `app/src/api/authHeaders.ts`.
- Deep-link callback token handling is implemented in `app/App.tsx`.
- Refresh flow is prepared through `/v1/auth/refresh` and logout via `/v1/auth/logout`.
