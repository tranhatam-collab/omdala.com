# Team 2 Wave 0 ADR: Data and Runtime Authority

Date: 2026-10-07 (Asia/Ho_Chi_Minh)
Owner: Team 2
Status: `PROPOSED_PENDING_FOUNDER_AND_TEAM4`
Source SHA: `415927e5f1580d539013b55765dfba834de655e7`

## Decision Needed

The main API currently implements PostgreSQL queries through Hyperdrive or a
`DATABASE_URL` fallback, while the repository also contains D1 migrations and
legacy D1 ownership language. No production or staging binding is accepted by
this ADR. A single authority must be approved before migration, deployment, or
data acceptance.

## Recommended Authority

Use PostgreSQL through an explicitly named Cloudflare Hyperdrive binding for
the main API domains: identity, account, billing, reality, audit, and AI
persistence. Keep the Omniverse product D1 database separate until a later
consolidation ADR. Do not dual-write and do not select a database from a
request-controlled header.

The recommendation follows the current `services/api` repository code and its
PostgreSQL migration set. It is not an approval and does not prove that a
Hyperdrive resource exists in any Cloudflare account.

## Required Gates

1. Founder and Team 4 approve the authority and ownership boundary.
2. Team 1 supplies exact staging and production resource identities through a
   read-back receipt; placeholder IDs are not acceptable.
3. The canonical Worker configuration contains one environment-specific
   Hyperdrive binding and no unapproved runtime database fallback.
4. Migration rehearsal proves forward application, backup/restore, tenant
   ownership constraints, and a semantic query on the exact deployed SHA.
5. The independent reviewer verifies the receipt before any production action.

## Rejected Shortcuts

- Do not use D1 and PostgreSQL as dual authorities.
- Do not treat local in-memory seed data as staging or production persistence.
- Do not run `wrangler deploy`, `psql`, DNS changes, secret changes, or remote
  migrations from this packet.

## Current Gate

`BLOCKED_PENDING_APPROVAL_AND_BINDING`

Source implementation and local tests can proceed in the isolated Team 2
worktree. Runtime closure remains blocked until the authority, resource IDs,
protected environment, and independent acceptance are present.
