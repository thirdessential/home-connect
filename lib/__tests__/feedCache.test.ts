import assert from "node:assert/strict";
import { test } from "node:test";
import { dedupeFeeds, isFeedCacheFresh } from "../feedCache";

const DAY = 86_400_000;
const NOW = Date.parse("2030-01-10T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const item = (_id: string, type: string, createdAt?: string): any => ({ _id, type, createdAt });
const ids = (xs: any[]) => xs.map((x) => x._id);

test("posts older than 48 hours stay visible", () => {
  const feeds = [item("p49h", "post", ago(49 * 3_600_000)), item("poll3d", "poll", ago(3 * DAY)), item("new", "post", ago(1000))];
  assert.deepEqual(ids(dedupeFeeds(feeds)), ["p49h", "poll3d", "new"]);
});
test("posts and polls older than 30 days stay visible", () => {
  const feeds = [item("p31", "post", ago(31 * DAY)), item("q90", "poll", ago(90 * DAY)), item("e40", "event", ago(40 * DAY)), item("p365", "post", ago(365 * DAY))];
  assert.deepEqual(ids(dedupeFeeds(feeds)), ["p31", "q90", "e40", "p365"]);
});
test("items with a missing/unparseable timestamp or only updatedAt are kept", () => {
  const feeds = [item("none", "post"), item("bad", "post", "not-a-date"), { _id: "u", type: "post", updatedAt: ago(5 * DAY) } as any];
  assert.deepEqual(ids(dedupeFeeds(feeds)), ["none", "bad", "u"]);
});
test("duplicates and id-less items are dropped, order is kept", () => {
  const feeds = [item("a", "event", ago(DAY)), item("a", "event", ago(DAY)), { type: "post" } as any, item("b", "post", ago(DAY))];
  assert.deepEqual(ids(dedupeFeeds(feeds)), ["a", "b"]);
});

test("cache freshness depends on fetch time only, never on post age", () => {
  assert.equal(isFeedCacheFresh(null, 2 * DAY, NOW), false);
  assert.equal(isFeedCacheFresh(NOW - 1000, 2 * DAY, NOW), true);
  assert.equal(isFeedCacheFresh(NOW - 3 * DAY, 2 * DAY, NOW), false); // stale cache => refetch (list is kept meanwhile)
});
