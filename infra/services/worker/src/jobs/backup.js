// Queue-triggered backups are disabled. Backups must be created by the
// protected pre-migration gate or the reviewed backup service so the database,
// destination, encryption, digest, restore target, and receipt are fixed by
// trusted control-plane inputs.

export const WORKER_BACKUP_DISABLED =
  'WORKER_BACKUP_DISABLED_USE_PROTECTED_BACKUP_WORKFLOW';

export async function backupJob() {
  throw new Error(WORKER_BACKUP_DISABLED);
}
