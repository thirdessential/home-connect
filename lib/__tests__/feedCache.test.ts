import assert from "node:assert/strict";
import { test } from "node:test";
import { pruneExpiredFeeds } from "../feedCache";

const DAY = 86_400_000;
const TTL = 2 * DAY;
const NOW = Date.parse("2030-01-10T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const item = (_id: string, type: string, createdAt?: string): any => ({ _id, type, createdAt });
const ids = (xs: any[]) => xs.map((x) => x._id);

test("recent items of every type are kept", () => {
  const feeds = [item("p", "post", ago(DAY)), item("q", "poll", ago(1000)), item("e", "event", ago(DAY))];
  assert.deepEqual(ids(pruneExpiredFeeds(feeds, TTL, NOW)), ["p", "q", "e"]);
});
test("posts and polls older than the TTL are still dropped (existing behavior)", () => {
  const feeds = [item("old-post", "post", ago(3 * DAY)), item("old-poll", "poll", ago(30 * DAY)), item("new", "post", ago(DAY))];
  assert.deepEqual(ids(pruneExpiredFeeds(feeds, TTL, NOW)), ["new"]);
});
test("event items are kept however old their post is: the server decides which events appear (ongoing/completed stay visible)", () => {
  const feeds = [item("done", "event", ago(40 * DAY)), item("live", "event", ago(3 * DAY)), item("post", "post", ago(40 * DAY))];
  assert.deepEqual(ids(pruneExpiredFeeds(feeds, TTL, NOW)), ["done", "live"]);
});
test("keepEvents:false restores the plain age rule (used for the cache-validity check)", () => {
  const feeds = [item("done", "event", ago(40 * DAY)), item("fresh", "post", ago(1000))];
  assert.deepEqual(ids(pruneExpiredFeeds(feeds, TTL, NOW, { keepEvents: false })), ["fresh"]);
  // a cache holding only old events is NOT valid, so it still gets refetched
  assert.equal(pruneExpiredFeeds([item("done", "event", ago(40 * DAY))], TTL, NOW, { keepEvents: false }).length, 0);
});
test("duplicates and items without an id are dropped, order is kept", () => {
  const feeds = [item("a", "event", ago(DAY)), item("a", "event", ago(DAY)), { type: "post", createdAt: ago(DAY) } as any, item("b", "post", ago(DAY))];
  assert.deepEqual(ids(pruneExpiredFeeds(feeds, TTL, NOW)), ["a", "b"]);
});
test("items with a missing or unparseable timestamp are kept", () => {
  const feeds = [item("none", "post"), item("bad", "post", "not-a-date")];
  assert.deepEqual(ids(pruneExpiredFeeds(feeds, TTL, NOW)), ["none", "bad"]);
});
test("updatedAt is used when createdAt is missing", () => {
  const feeds = [{ _id: "u", type: "post", updatedAt: ago(5 * DAY) } as any];
  assert.deepEqual(ids(pruneExpiredFeeds(feeds, TTL, NOW)), []);
});

import { isFeedCacheFresh } from "../feedCache";

test("cache freshness uses the plain age rule: old events never keep a stale cache alive", () => {
  assert.equal(isFeedCacheFresh([], TTL, NOW), false);
  assert.equal(isFeedCacheFresh([item("done", "event", ago(40 * DAY))], TTL, NOW), false); // only an old event: refetch
  assert.equal(isFeedCacheFresh([item("done", "event", ago(40 * DAY)), item("p", "post", ago(1000))], TTL, NOW), true);
  assert.equal(isFeedCacheFresh([item("e", "event", ago(DAY))], TTL, NOW), true); // a recent event is a recent item
  assert.equal(isFeedCacheFresh([item("old", "post", ago(3 * DAY))], TTL, NOW), false);
});
