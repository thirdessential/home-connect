// Cache helpers for the Home feed.
//
// Posts, polls and events NEVER expire by age: a feed item stays visible until
// its creator (or an authorized admin) deletes it, and the server's feed query
// decides which events appear. The cache therefore only de-duplicates; it never
// drops an item because it is "old". (A previous 48-hour age prune made posts
// vanish from the app two days after they were created.)

type CachedFeed = { _id?: string };

/** Drops duplicates and id-less items, keeping order. Never filters by age. */
export const dedupeFeeds = <T extends CachedFeed>(feeds: T[]): T[] => {
  const seen = new Set<string>();
  return feeds.filter((feed) => {
    if (!feed?._id || seen.has(feed._id)) return false;
    seen.add(feed._id);
    return true;
  });
};

/**
 * Is the cached list recent enough to skip a refetch? Based on WHEN the list was
 * fetched, not on how old its posts are. Only decides whether to refetch — it
 * never removes anything from the list.
 */
export const isFeedCacheFresh = (
  lastFetchedAt: number | null | undefined,
  ttlMs: number,
  now: number = Date.now(),
): boolean => typeof lastFetchedAt === "number" && now - lastFetchedAt >= 0 && now - lastFetchedAt < ttlMs;
