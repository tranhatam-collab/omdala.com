import { describe, expect, it } from "vitest";
import { assertOutsideCandidate } from "./playwright-staging-policy";

const repo = "/work/omdala.com";

describe("assertOutsideCandidate", () => {
  it("rejects the checkout itself", () => {
    expect(() => assertOutsideCandidate(repo, repo, "OUT")).toThrow(/outside the candidate checkout/);
  });

  it("rejects a directory inside the checkout", () => {
    expect(() => assertOutsideCandidate(`${repo}/apps/app/out`, repo, "OUT")).toThrow(/outside/);
  });

  it("rejects <repo>/..name, a directory inside the checkout whose name starts with ..", () => {
    expect(() => assertOutsideCandidate(`${repo}/..name`, repo, "OUT")).toThrow(/outside/);
  });

  it("accepts <repo>/../x, a sibling directory outside the checkout", () => {
    expect(() => assertOutsideCandidate("/work/x", repo, "OUT")).not.toThrow();
  });

  it("accepts a parent of the checkout", () => {
    expect(() => assertOutsideCandidate("/work", repo, "OUT")).not.toThrow();
  });

  it("accepts a real outside path", () => {
    expect(() => assertOutsideCandidate("/var/tmp/e2e-output", repo, "OUT")).not.toThrow();
  });
});
