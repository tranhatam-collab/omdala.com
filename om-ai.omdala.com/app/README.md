# AI Om App

Expo-based mobile app scaffold that consumes the shared API contracts.

## Getting started

```bash
cd app
npm install
npm run start
```

Environment variables:

- `EXPO_PUBLIC_API_BASE_URL` (defaults to `https://api.omdala.com`)

## Structure

- `src/api` – REST clients wrapping shared contracts.
- `src/hooks` – React hooks for timeline and scenes.
- `src/screens` – Sign in, timeline, scenes, settings screens.
- `src/navigation` – React Navigation stack.
- `src/session` – fail-closed native session boundary.

## Next steps

- Integrate a platform-owned OMDALA native session bridge before enabling protected API calls.
- Add E2E smoke tests (login → timeline → scene run).
- Wire app release CI similar to web deploy.
