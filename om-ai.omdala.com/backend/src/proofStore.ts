import type { ProofRecord } from './types.js';
import { persistence } from './persistence.js';

export async function createProof(record: ProofRecord): Promise<ProofRecord> {
  return persistence.putProof(record);
}

export async function getProofById(proofId: string): Promise<ProofRecord | undefined> {
  return persistence.getProof(proofId);
}
