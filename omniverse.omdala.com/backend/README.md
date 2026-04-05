# backend/

Omniverse domain backend services.

Owns:

- /v2/omniverse APIs
- rooms/devices/scenes/gateway/automation/proof domain logic

Consumes shared-core APIs from api.omdala.com/v1.

## Phase O1 starter implementation

- Runtime bootstrap: `backend/src/index.js`
- HTTP server: `backend/src/server.js`
- O1 schema: `backend/src/schemas/omniverse-o1.schema.json`
- O1 contract: `backend/src/contracts/omniverse-o1.openapi.json`
- Flow endpoint: `POST /v2/omniverse/flows/login-room-state`

Database-backed O1 repository:

- Postgres schema: `backend/src/db/schema/postgres.sql`
- D1 schema: `backend/src/db/schema/d1.sql`
- Adapter bootstrap: `backend/src/db/createDbAdapter.js`

Required environment:

- `SHARED_CORE_BASE_URL` (default: `https://api.omdala.com`)
- `DATABASE_URL` for Postgres, or D1 binding in Worker runtime
- Optional local fallback: `OMNIVERSE_DB_MODE=memory`

Demo credentials for local tests:

- email: `owner@omdala.com`
- password: `demo-owner-pass`
