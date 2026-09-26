import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await fs.readFile(
  new URL("../native/verification-driver.js", import.meta.url),
  "utf8",
);
function setup() {
  const window = {};
  vm.runInNewContext(source, { window });
  const driver = window.__omcodeNativeVerification;
  return { driver, snapshot: () => JSON.parse(driver.snapshot()) };
}

test("native verification retains an asynchronous task and exposes only synchronous result snapshots", async () => {
  const { driver, snapshot } = setup();
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  assert.equal(
    driver.start(() => pending),
    "started",
  );
  assert.equal(typeof driver.task.then, "function");
  assert.deepEqual(snapshot(), { status: "running" });
  finish({ approvedWrite: true });
  await driver.task;
  assert.deepEqual(snapshot(), {
    status: "complete",
    value: { approvedWrite: true },
  });
});

test("native verification captures synchronous and asynchronous failures without a success receipt", async () => {
  for (const run of [
    () => {
      throw new Error("fixture failed");
    },
    () => Promise.reject("fixture failed"),
  ]) {
    const { driver, snapshot } = setup();
    driver.start(run);
    await driver.task;
    assert.deepEqual(snapshot(), { status: "failed", error: "fixture failed" });
  }
});

test("native verification cannot restart pending, completed or failed work", async () => {
  for (const run of [
    () => new Promise(() => {}),
    () => true,
    () => Promise.reject("failed"),
  ]) {
    const { driver } = setup();
    driver.start(run);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.throws(() => driver.start(() => true), /already started/);
  }
});

test("native verification rejects invalid work and never labels pending work complete", async () => {
  const { driver, snapshot } = setup();
  assert.throws(() => driver.start(null), /requires a function/);
  assert.deepEqual(snapshot(), { status: "idle" });
  driver.start(() => new Promise(() => {}));
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(snapshot(), { status: "running" });
});

test("reinjection preserves an existing native verification instead of hiding its failure", async () => {
  const window = {};
  vm.runInNewContext(source, { window });
  const driver = window.__omcodeNativeVerification;
  driver.start(() => {
    throw new Error("keep evidence");
  });
  await driver.task;
  vm.runInNewContext(source, { window });
  assert.equal(window.__omcodeNativeVerification, driver);
  assert.equal(JSON.parse(driver.snapshot()).error, "keep evidence");
});
