// Backup Job Handler
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function backupJob(job) {
  const { dbName, target } = job.data;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpFile = `/tmp/backup_${dbName}_${timestamp}.sql.gz`;

  try {
    // pg_dump
    await execAsync(
      `pg_dump -U ${process.env.POSTGRES_USER} -d ${dbName} --no-owner --no-privileges | gzip > ${dumpFile}`
    );

    // Upload to R2
    await execAsync(
      `aws s3 cp ${dumpFile} s3://${process.env.R2_BUCKET_BACKUPS}/backups/postgres/backup_${dbName}_${timestamp}.sql.gz ` +
      `--endpoint-url ${process.env.R2_ENDPOINT} --region auto`
    );

    // Optional: upload to B2
    if (process.env.B2_BUCKET) {
      await execAsync(
        `b2 upload-file ${process.env.B2_BUCKET} ${dumpFile} backups/postgres/backup_${dbName}_${timestamp}.sql.gz`
      );
    }

    return { success: true, file: dumpFile, size: 'unknown' };
  } finally {
    // Cleanup
    await execAsync(`rm -f ${dumpFile}`).catch(() => {});
  }
}
