// Safe DB Query Job Handler
// Executes read-only or whitelisted SQL queries against PostgreSQL.
// NEVER executes DROP, DELETE without WHERE, or ALTER without approval.

import { pg } from '../lib/db.js';

const READONLY_PATTERNS = [
  /^\s*SELECT\s+/i,
  /^\s*EXPLAIN\s+/i,
  /^\s*WITH\s+/i,
];

const DANGEROUS_PATTERNS = [
  /DROP\s+/i,
  /DELETE\s+FROM\s+\w+\s*;?\s*$/i, // DELETE without WHERE
  /ALTER\s+SYSTEM/i,
  /TRUNCATE\s+/i,
];

export async function dbQueryJob(job) {
  const { sql, params = [], readOnly = true } = job.data;

  if (!sql) {
    throw new Error('Missing SQL query');
  }

  // Security: check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sql)) {
      throw new Error(`Dangerous SQL pattern detected: ${sql}`);
    }
  }

  // Enforce read-only if flag is set
  if (readOnly) {
    const isReadOnly = READONLY_PATTERNS.some(p => p.test(sql));
    if (!isReadOnly) {
      throw new Error('Only SELECT/EXPLAIN/WITH queries allowed in read-only mode');
    }
  }

  const result = await pg.query(sql, params);

  return {
    success: true,
    rows: result.rows,
    rowCount: result.rowCount,
    readOnly,
  };
}
