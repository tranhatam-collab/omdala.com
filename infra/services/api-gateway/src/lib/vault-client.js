// Vault Client (Phase 1 Secret Management)
// Provides read/write access to HashiCorp Vault KV v2.
// Falls back to Cloudflare Secrets Store if Vault is unavailable.

const VAULT_ADDR = process.env.VAULT_ADDR;
const VAULT_TOKEN = process.env.VAULT_TOKEN;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

export class VaultClient {
  constructor() {
    this.enabled = !!VAULT_ADDR && !!VAULT_TOKEN;
    this.cfFallback = !!CF_API_TOKEN && !!CF_ACCOUNT_ID;
  }

  async read(path) {
    if (this.enabled) {
      return this.readFromVault(path);
    }
    if (this.cfFallback) {
      return this.readFromCloudflare(path);
    }
    throw new Error('No secret backend configured (need VAULT_ADDR+VAULT_TOKEN or CLOUDFLARE_API_TOKEN)');
  }

  async write(path, data) {
    if (this.enabled) {
      return this.writeToVault(path, data);
    }
    if (this.cfFallback) {
      return this.writeToCloudflare(path, data);
    }
    throw new Error('No secret backend configured');
  }

  async readFromVault(path) {
    const res = await fetch(`${VAULT_ADDR}/v1/secret/data/${path}`, {
      headers: { 'X-Vault-Token': VAULT_TOKEN },
    });
    if (!res.ok) throw new Error(`Vault read failed: ${res.status}`);
    const body = await res.json();
    return body.data?.data;
  }

  async writeToVault(path, data) {
    const res = await fetch(`${VAULT_ADDR}/v1/secret/data/${path}`, {
      method: 'POST',
      headers: {
        'X-Vault-Token': VAULT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error(`Vault write failed: ${res.status}`);
    return true;
  }

  async readFromCloudflare(key) {
    // Cloudflare Secrets Store (Workers Secrets) is read-only at runtime via bindings
    // For admin operations, we use the REST API
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/secrets`,
      { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
    );
    if (!res.ok) throw new Error(`Cloudflare secrets read failed: ${res.status}`);
    const body = await res.json();
    const secret = body.result?.find(s => s.name === key);
    if (!secret) throw new Error(`Secret not found: ${key}`);
    return secret;
  }

  async writeToCloudflare(key, value) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/secrets`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: key, text: value }),
      }
    );
    if (!res.ok) throw new Error(`Cloudflare secrets write failed: ${res.status}`);
    return true;
  }
}

// Singleton instance
export const vault = new VaultClient();
