# OMDALA Database Layer

This directory contains the canonical SQL schema and migrations for the OMDALA reality core.

## Files

- `schema.sql`: full canonical schema
- `../migrations/0001_reality_core.up.sql`: initial migration up
- `../migrations/0001_reality_core.down.sql`: initial migration down

## Apply (PostgreSQL)

```bash
psql "$DATABASE_URL" -f infra/db/schema.sql
```

## Apply migration up/down

```bash
psql "$DATABASE_URL" -f infra/migrations/0001_reality_core.up.sql
psql "$DATABASE_URL" -f infra/migrations/0001_reality_core.down.sql
```

## Notes

- IDs are currently application-generated `TEXT` for compatibility across edge runtimes.
- `events` is append-only by design and should never be used as a mutable state table.
- Proof binary/object storage should live in R2; SQL stores metadata and references only.
