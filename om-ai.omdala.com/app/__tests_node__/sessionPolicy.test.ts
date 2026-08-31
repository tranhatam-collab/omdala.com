import assert from 'node:assert/strict';
import test from 'node:test';
import { SHARED_API_CONTRACT_VERSION } from '../../shared/api-contracts';

test('shared contract version is locked to v1', () => {
  assert.equal(SHARED_API_CONTRACT_VERSION, '1.0.0');
});
