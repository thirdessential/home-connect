// Age pruning for the cached Home feed. Posts and polls older than the cache TTL
// are dropped; event items are not — which events appear (upcoming, ongoing,
// completed) is decided by the server's feed query, so an ended event must not
// vanish from Home just because its post is old. `keepEvents: false` restores
// the plain age rule, which the cache-validity check still needs (otherwise a
// cache holding one old event would never expire and never be refetched).

type PrunableFeed = { _id?: string; type?: string; createdAt?: string; updatedAt?: string };

export const pruneExpiredFeeds = <T extends PrunableFeed>(
  feeds: T[],
  ttlMs: number,
  now: number = Date.now(),
  { keepEvents = true }: { keepEvents?: boolean } = {},
): T[] => {
  const cutoff = now - ttlMs;
  const seen = new Set<string>();
  return feeds.filter((feed) => {
    const timestamp = feed.createdAt || feed.updatedAt;
    const isRecent =
      !timestamp ||
      Number.isNaN(new Date(timestamp).getTime()) ||
      new Date(timestamp).getTime() >= cutoff;
    const keep = isRecent || (keepEvents && feed.type === "event");
    if (!keep || !feed?._id || seen.has(feed._id)) return false;
    seen.add(feed._id);
    return true;
  });
};

/** Is the cached list still worth showing without a refetch? Plain age rule: only a recent item counts, never an old event. */
export const isFeedCacheFresh = (feeds: PrunableFeed[], ttlMs: number, now: number = Date.now()): boolean =>
  pruneExpiredFeeds(feeds, ttlMs, now, { keepEvents: false }).length > 0;
