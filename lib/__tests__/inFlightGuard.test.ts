import assert from "node:assert/strict";
import { test } from "node:test";
import { createInFlightGuard } from "../inFlightGuard";

const deferred = () => {
  let resolve!: (v?: unknown) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

test("a second call for the same key while one is running is ignored (rapid taps send one request)", async () => {
  const guard = createInFlightGuard();
  const gate = deferred();
  let calls = 0;
  const run = () => guard.run("post-1", async () => { calls++; await gate.promise; return "sent"; });

  const first = run();
  const second = run();
  const third = run();
  assert.equal(calls, 1);
  assert.equal(await second, undefined);
  assert.equal(await third, undefined);
  gate.resolve();
  assert.equal(await first, "sent");
  assert.equal(calls, 1);
});

test("different keys do not block each other", async () => {
  const guard = createInFlightGuard();
  const gate = deferred();
  let calls = 0;
  const a = guard.run("post-1", async () => { calls++; await gate.promise; });
  const b = guard.run("post-2", async () => { calls++; await gate.promise; });
  assert.equal(calls, 2);
  gate.resolve();
  await Promise.all([a, b]);
});

test("the key is released after success, so the next tap works", async () => {
  const guard = createInFlightGuard();
  let calls = 0;
  await guard.run("post-1", async () => { calls++; });
  await guard.run("post-1", async () => { calls++; });
  assert.equal(calls, 2);
});

test("the key is released after a failure too — a failed request can never lock the button", async () => {
  const guard = createInFlightGuard();
  await assert.rejects(guard.run("post-1", async () => { throw new Error("network"); }), /network/);
  assert.equal(guard.isRunning("post-1"), false);
  let ran = false;
  await guard.run("post-1", async () => { ran = true; });
  assert.equal(ran, true);
});

test("isRunning reflects the in-flight state", async () => {
  const guard = createInFlightGuard();
  const gate = deferred();
  const p = guard.run("post-1", async () => { await gate.promise; });
  assert.equal(guard.isRunning("post-1"), true);
  assert.equal(guard.isRunning("post-2"), false);
  gate.resolve();
  await p;
  assert.equal(guard.isRunning("post-1"), false);
});
