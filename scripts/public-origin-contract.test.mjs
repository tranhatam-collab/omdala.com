import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizePublicPath,
  resolvePublicOrigin,
  validatePublicOrigin,
} from "../packages/core/src/public-origins.mjs";

describe("protected public-origin contract", () => {
  it("accepts each canonical production origin only in production", () => {
    assert.equal(
      validatePublicOrigin("web", "https://omdala.com", "production"),
      "https://omdala.com",
    );
    assert.equal(
      validatePublicOrigin("app", "https://app.omdala.com", "production"),
      "https://app.omdala.com",
    );
    assert.equal(
      validatePublicOrigin("auth", "https://auth.omdala.com", "production"),
      "https://auth.omdala.com",
    );
    assert.equal(
      validatePublicOrigin("api", "https://api.omdala.com", "production"),
      "https://api.omdala.com",
    );
    assert.equal(
      validatePublicOrigin("brand", "https://brand.omdala.com", "production"),
      "https://brand.omdala.com",
    );
  });

  it("accepts only the canonical isolated OMDALA staging origins", () => {
    assert.equal(
      validatePublicOrigin("web", "https://staging.omdala.com", "staging"),
      "https://staging.omdala.com",
    );
    assert.equal(
      validatePublicOrigin(
        "app",
        "https://app-staging.omdala.com",
        "staging",
      ),
      "https://app-staging.omdala.com",
    );
    assert.equal(
      validatePublicOrigin(
        "auth",
        "https://auth-staging.omdala.com",
        "staging",
      ),
      "https://auth-staging.omdala.com",
    );
    assert.equal(
      validatePublicOrigin(
        "api",
        "https://api-staging.omdala.com",
        "staging",
      ),
      "https://api-staging.omdala.com",
    );
    assert.equal(
      validatePublicOrigin(
        "brand",
        "https://brand-staging.omdala.com",
        "staging",
      ),
      "https://brand-staging.omdala.com",
    );
  });

  it("rejects missing environment or origin values", () => {
    assert.throws(() => validatePublicOrigin("app", undefined, "staging"));
    assert.throws(() =>
      validatePublicOrigin("auth", "https://auth-staging.omdala.com", undefined),
    );
  });

  it("rejects production and staging cross-environment origins", () => {
    assert.throws(() =>
      validatePublicOrigin("app", "https://app.omdala.com", "staging"),
    );
    assert.throws(() =>
      validatePublicOrigin(
        "auth",
        "https://auth-staging.omdala.com",
        "production",
      ),
    );
  });

  it("rejects wrong-surface, insecure, and decorated origins", () => {
    for (const origin of [
      "https://auth-staging.omdala.com",
      "https://myapp-staging.omdala.com",
      "http://app-staging.omdala.com",
      "https://app-staging.omdala.com:8443",
      "https://app-staging.omdala.com/workspace",
      "https://user@app-staging.omdala.com",
      "https://app-attacker.pages.dev",
      "https://app-staging.omdala.com.attacker.example",
      "https://attacker.example",
    ]) {
      assert.throws(() => validatePublicOrigin("app", origin, "staging"));
    }
  });

  it("allows an implicit production default only when both values are absent", () => {
    assert.equal(
      resolvePublicOrigin("auth", undefined, undefined),
      "https://auth.omdala.com",
    );
    assert.throws(() => resolvePublicOrigin("auth", "", undefined));
    assert.throws(() => resolvePublicOrigin("auth", undefined, "staging"));
  });

  it("normalizes only same-origin relative paths", () => {
    assert.equal(
      normalizePublicPath("/profile?lang=vi#identity", "/dashboard"),
      "/profile?lang=vi#identity",
    );
    assert.equal(
      normalizePublicPath("https://attacker.example", "/dashboard"),
      "/dashboard",
    );
    assert.equal(
      normalizePublicPath("//attacker.example/path", "/dashboard"),
      "/dashboard",
    );
    assert.equal(
      normalizePublicPath("/\\attacker.example", "/dashboard"),
      "/dashboard",
    );
  });
});
