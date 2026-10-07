# Om AI Backend

Backend skeleton for reality planning, policy, proof, gateway coordination, and Om AI Live session contracts.

## Runtime status

Direct public operation is intentionally disabled. `/health` reports process liveness, while `/ready` and every `/v2/*` route return `503 omdala_identity_authority_unavailable`. Browser and mobile products must use the canonical OMDALA API at `api.omdala.com`.

The backend does not accept `Bearer user:role`, `x-user-id`, `x-role`, request-body identity, or query-string identity. Internal route tests bind a verified principal through a server-only symbol; that harness is not used by `src/index.ts` or `src/server.ts`.

Do not expose this backend or proxy operational routes until the canonical OMDALA session verifier is integrated, tenant and ownership checks are complete, and an independent runtime test proves spoofed and cross-user requests fail closed.
