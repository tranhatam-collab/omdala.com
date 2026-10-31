// Adapters for the two token options in docs/contracts/OMAI_SESSION_BRIDGE_CONTRACT_DRAFT.md section 10.
// Both produce the same BridgeVerifier port, so the owner's choice only swaps the adapter.
// Neither makes a network call itself: the introspection call and the key source are injected.
import { createPublicKey, verify as cryptoVerify, type KeyObject } from 'node:crypto';
import { BridgeTokenRevoked, BridgeVerifierUnavailable, type BridgeVerifier } from './consumer.js';

export type IntrospectionAnswer = { active?: unknown; reason?: unknown; claims?: unknown };

/** Option (a): the API answers {active, claims} for the token after its own checks. Revocation is immediate. */
export function createIntrospectionVerifier(introspect: (token: string) => Promise<IntrospectionAnswer>): BridgeVerifier {
  return async (token) => {
    let answer: IntrospectionAnswer;
    try {
      answer = await introspect(token);
    } catch {
      throw new BridgeVerifierUnavailable();
    }
    if (typeof answer !== 'object' || answer === null || typeof answer.active !== 'boolean') {
      // A malformed answer is an authority fault, never an accept and never a plain "invalid".
      throw new BridgeVerifierUnavailable('bridge_introspection_malformed');
    }
    if (!answer.active) {
      if (answer.reason === 'revoked') throw new BridgeTokenRevoked();
      return null;
    }
    return answer.claims ?? null;
  };
}

export type PublishedKeyOptions = {
  /** Public keys by kid, from the cached JWKS. May throw when no key set is available. */
  getKeys: () => Map<string, KeyObject> | Promise<Map<string, KeyObject>>;
  issuer: string;
};

const b64urlToBuffer = (value: string) => Buffer.from(value, 'base64url');

function parseJson(buffer: Buffer): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(buffer.toString('utf8'));
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Build a key object from one published JWK (an OKP/Ed25519 public key). */
export function publicKeyFromJwk(jwk: { kty: string; crv: string; x: string }): KeyObject {
  return createPublicKey({ key: jwk, format: 'jwk' });
}

/**
 * Option (b): a JWT signed with EdDSA (Ed25519) and verified offline. Only the algorithm the
 * draft names is accepted (never `none`, never a symmetric algorithm), the key is chosen by `kid`
 * from the published set, and `iss` must match. Revocation is then only at expiry unless the
 * consumer is also given a revocation check.
 */
export function createPublishedKeyVerifier(options: PublishedKeyOptions): BridgeVerifier {
  return async (token) => {
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => part.length === 0)) return null;
    const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];

    const header = parseJson(b64urlToBuffer(headerPart));
    if (!header || header.alg !== 'EdDSA' || typeof header.kid !== 'string') return null;

    let keys: Map<string, KeyObject>;
    try {
      keys = await options.getKeys();
    } catch {
      throw new BridgeVerifierUnavailable('bridge_keys_unavailable');
    }
    const key = keys.get(header.kid);
    if (!key) return null;

    const valid = cryptoVerify(null, Buffer.from(`${headerPart}.${payloadPart}`), key, b64urlToBuffer(signaturePart));
    if (!valid) return null;

    const payload = parseJson(b64urlToBuffer(payloadPart));
    if (!payload || payload.iss !== options.issuer) return null;
    return payload;
  };
}
