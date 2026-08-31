import assert from 'node:assert/strict';
import test from 'node:test';
import { getAuthToken, setAuthToken, withAuthHeaders } from '../src/api/authHeaders';

test('auth header state updates and merges', () => {
  setAuthToken(null);
  assert.equal(getAuthToken(), null);
  assert.deepEqual(withAuthHeaders(), {});

  setAuthToken('token_123');
  assert.equal(getAuthToken(), 'token_123');
  assert.deepEqual(withAuthHeaders({ 'x-test': '1' }), {
    Authorization: 'Bearer token_123',
    'x-test': '1',
  });
});
