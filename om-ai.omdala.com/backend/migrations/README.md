# Backend Migrations

This folder is reserved for database migration scripts.

Planned rollout:

1. keep `JsonPersistenceAdapter` for local/dev bootstrap
2. implement `SqlitePersistenceAdapter` for single-node durable pilot
3. implement `PostgresPersistenceAdapter` for multi-node deployment

Migration naming convention:

- `YYYYMMDDHHMM__description.sql`
