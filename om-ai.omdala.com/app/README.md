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
- `src/hooks` – React hooks for magic link, timeline, scenes.
- `src/screens` – Sign in, timeline, scenes, settings screens.
- `src/navigation` – React Navigation stack.
- `src/session` – basic session provider (to evolve with policies).

## Next steps

- Integrate real session tokens and secure storage.
- Add E2E smoke tests (login → timeline → scene run).
- Wire app release CI similar to web deploy.
