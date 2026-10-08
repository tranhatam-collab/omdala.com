# Staging mail isolation

Status: source gate implemented; runtime remains blocked pending protected configuration and provider provisioning.

## Verified provider boundary

The audited `mail.iai.one` source supports workspace isolation through
`X-Workspace-Id`, but its outbound send request has no verified sandbox,
recipient override, or sink field. OMDALA therefore enforces the sink before
provider egress instead of claiming a provider feature that is not present.

The existing mail API origin and payload contract are unchanged in this patch.
Provisioning a distinct `omdala.com-staging` workspace and a credential accepted
for that workspace remains an external requirement.

## Enforced behavior

- Production must declare `MAIL_DELIVERY_MODE=direct` and workspace
  `omdala.com`. Original recipients are preserved.
- Staging must declare `MAIL_DELIVERY_MODE=sink`, workspace
  `omdala.com-staging`, and a valid protected `MAIL_STAGING_SINK_ADDRESS`.
- Every staging request recipient is replaced with exactly one normalized sink
  address before `fetch` is called. A request-supplied `workspace_id` cannot
  override the protected workspace.
- Missing or invalid staging policy values fail before any provider request.
- Receipts record `deliveryMode`, `sinkEnforced`, `workspaceId`, original and
  delivered recipient counts, and a SHA-256 fingerprint of the delivered
  recipient set. They do not disclose the sink address.

## Protected configuration

GitHub Environment `staging` must provide
`OMDALA_MAIL_STAGING_SINK_ADDRESS`. The release workflow adds it atomically to
the staging Worker secret bundle as `MAIL_STAGING_SINK_ADDRESS`. Production
must not contain that secret.

Runtime acceptance remains blocked until all of the following exist:

1. the `omdala.com-staging` workspace at the mail authority;
2. a staging credential authorized for that workspace;
3. a controlled sink mailbox entered only through the protected GitHub
   Environment;
4. exact provider message IDs plus the sink-mode receipt in staging E2E;
5. inbox or provider readback for the sink message IDs.

No mail was sent while implementing or testing this source gate.
