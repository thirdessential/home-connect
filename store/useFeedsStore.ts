import { CACHE_TTL_MS } from "@/assets/constants/common.constant";
import { Delete, Get, Patch, Post } from "@/lib/httpMethods";
import { zustandStorage } from "@/lib/storage";
import { ReportItem } from "@/types/business.type";
import { FeedItem, FeedsState, RsvpUser } from "@/types/feeds.type";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useFeedsStore = create<FeedsState>()(
    persist(
        (set, get) => ({
            feeds: [],
            loading: false,
            error: null,
            feedsByUser: [],
            lastFetchedAt: null,
            cachedSocietyId: null,

            isCacheValid: (societyId: string) => {
                const { lastFetchedAt, cachedSocietyId, feeds } = get();
                if (!lastFetchedAt || !cachedSocietyId || feeds.length === 0) return false;
                if (cachedSocietyId !== societyId) return false;
                return Date.now() - lastFetchedAt < CACHE_TTL_MS;
            },

            fetchFeedsBySociety: async (societyId: string, force = false) => {
                // Use cache if valid and not forced
                if (!force && get().isCacheValid(societyId)) return;

                set({ loading: true, error: null });
                try {
                    const response = await Get<{ code: number; feeds: FeedItem[] }>(
                        `/api/feed/getfeeds/${societyId}`,
                    );
                    if (response?.code === 200) {
                        set({
                            feeds: response.feeds,
                            loading: false,
                            lastFetchedAt: Date.now(),   // ← stamp the cache
                            cachedSocietyId: societyId,
                        });
                    } else {
                        set({ error: "Failed to fetch feeds", loading: false });
                    }
                } catch {
                    set({ error: "Failed to fetch feeds", loading: false });
                }
            },

            getFeedsByUserId: async (userId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; feeds: FeedItem[] }>(
                        `/api/feed/user/${userId}`,
                    );
                    if (response?.success) {
                        set({ feedsByUser: response.feeds, loading: false });
                    } else {
                        set({ error: "Failed to fetch user feeds", loading: false });
                    }
                } catch {
                    set({ error: "Failed to fetch user feeds", loading: false });
                }
            },
            setFeedsByUser: (feeds: FeedItem[]) => {
                set({ feedsByUser: feeds });
            },
            createFeed: async (feed: Partial<FeedItem>) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        code: number;
                        feed: FeedItem;
                        success: boolean;
                    }>(`/api/feed/create`, feed);
                    if (response?.code === 201 && response.success) {
                        set((state) => {
                            const tempFeedIndex = state.feeds.findIndex((f) =>
                                f._id.startsWith("temp-"),
                            );
                            if (tempFeedIndex !== -1) {
                                const tempFeed = state.feeds[tempFeedIndex];
                                const mergedFeed = {
                                    ...response.feed,
                                    user:
                                        typeof response.feed.user === "string" &&
                                            typeof tempFeed.user === "object"
                                            ? tempFeed.user
                                            : response.feed.user,
                                };
                                const newFeeds = [...state.feeds];
                                newFeeds[tempFeedIndex] = mergedFeed;
                                return { feedItem: mergedFeed, feeds: newFeeds, loading: false };
                            } else {
                                return {
                                    feedItem: response.feed,
                                    feeds: [response.feed, ...state.feeds],
                                    loading: false,
                                };
                            }
                        });
                    } else {
                        set({ error: "Failed to create feed", loading: false });
                    }
                } catch {
                    set({ error: "Failed to create feed", loading: false });
                }
            },
            addFeedOptimistically: (feed: FeedItem) => {
                set((state) => ({ feeds: [feed, ...state.feeds] }));
            },
            toggleLike: async (feedId: string, userId: string) => {
                set((state) => ({
                    feeds: state.feeds.map((f) => {
                        if (f._id === feedId) {
                            const likes = f.likes || [];
                            const userIndex = likes.findIndex((like: any) =>
                                typeof like === "string" ? like === userId : like._id === userId,
                            );
                            if (userIndex !== -1) {
                                return { ...f, likes: likes.filter((_, i) => i !== userIndex) };
                            } else {
                                return { ...f, likes: [...likes, userId] };
                            }
                        }
                        return f;
                    }),
                }));
                try {
                    const response = await Patch<{
                        code: number;
                        success: boolean;
                        feed: FeedItem;
                    }>(`/api/feed/${feedId}/like`, { userId });
                    if (response?.code === 200 && response.success) {
                        set((state) => ({
                            feeds: state.feeds.map((f) =>
                                f._id === feedId ? { ...f, likes: response.feed.likes } : f,
                            ),
                        }));
                    } else {
                        set((state) => ({
                            feeds: state.feeds.map((f) => {
                                if (f._id === feedId) {
                                    const likes = f.likes || [];
                                    const userIndex = likes.findIndex((like: any) =>
                                        typeof like === "string" ? like === userId : like._id === userId,
                                    );
                                    if (userIndex !== -1) {
                                        return { ...f, likes: [...likes, userId] };
                                    } else {
                                        return {
                                            ...f,
                                            likes: likes.filter((like: any) =>
                                                typeof like === "string" ? like !== userId : like._id !== userId,
                                            ),
                                        };
                                    }
                                }
                                return f;
                            }),
                            error: "Failed to toggle like",
                        }));
                    }
                } catch {
                    set((state) => ({
                        feeds: state.feeds.map((f) => {
                            if (f._id === feedId) {
                                const likes = f.likes || [];
                                const userIndex = likes.findIndex((like: any) =>
                                    typeof like === "string" ? like === userId : like._id === userId,
                                );
                                if (userIndex !== -1) {
                                    return { ...f, likes: [...likes, userId] };
                                } else {
                                    return {
                                        ...f,
                                        likes: likes.filter((like: any) =>
                                            typeof like === "string" ? like !== userId : like._id !== userId,
                                        ),
                                    };
                                }
                            }
                            return f;
                        }),
                        error: "Failed to toggle like",
                    }));
                }
            },
            getFeedById: async (feedId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ code: number; feed: FeedItem }>(
                        `/api/feed/getFeed/${feedId}`,
                    );
                    if (response?.code === 200) {
                        set({ feedItem: response.feed, loading: false });
                    } else {
                        set({ error: "Failed to fetch feeds", loading: false });
                    }
                } catch {
                    set({ error: "Failed to fetch feeds", loading: false });
                }
            },
            updateFeed: async (feedId: string, data: Partial<FeedItem>) => {
                set({ loading: true, error: null });
                try {
                    const response = await Patch<{ code: number; feed: FeedItem }>(
                        `/api/feed/update/${feedId}`,
                        data,
                    );
                    if (response?.code === 200) {
                        set({ feedItem: response.feed, loading: false });
                    } else {
                        set({ error: "Failed to update feed", loading: false });
                    }
                } catch (error) {
                    console.error("Feed update error:", error);
                    set({ error: "Failed to update feed", loading: false });
                }
            },
            removeFeed: async (feedId: string) => {
                try {
                    const response = await Delete<{ success: boolean; message: string }>(
                        `/api/feed/${feedId}`,
                    );
                    if (response?.success) {
                        set((state) => ({
                            feeds: state.feeds.filter((f) => f._id !== feedId),
                            feedsByUser: state.feedsByUser.filter((f) => f._id !== feedId),
                            error: null,
                        }));
                        return true;
                    }
                    set({ error: response?.message || "Failed to delete feed" });
                    return false;
                } catch (error) {
                    console.error("Feed deletion error:", error);
                    set({ error: error instanceof Error ? error.message : "Failed to delete feed" });
                    return false;
                }
            },
            addComment: async (feedId, comment) => {
                try {
                    const response = await Post<{ success: boolean; comments: any[] }>(
                        `/api/feed/comment/${feedId}`,
                        { userId: comment?.userId ?? comment?.user?._id, text: comment?.text },
                    );
                    if (response?.success) {
                        set((state) => ({
                            feeds: state.feeds.map((f) =>
                                f._id === feedId ? { ...f, comments: response.comments } : f,
                            ),
                        }));
                    }
                } catch (error) {
                    console.error("Failed to add comment:", error);
                    set({ error: "Failed to add comment" });
                    throw error;
                }
            },
            addReply: (feedId, commentId, reply) =>
                set((state) => ({
                    feeds: state.feeds.map((f) =>
                        f._id === feedId
                            ? {
                                ...f,
                                comments: (f.comments || []).map((c: any) =>
                                    c._id === commentId
                                        ? { ...c, replies: [...(c.replies || []), reply] }
                                        : c,
                                ),
                            }
                            : f,
                    ),
                })),
            votePoll: async (feedId: string, optionId: string, userId: string) => {
                set((state) => ({
                    feeds: state.feeds.map((f) => {
                        if (f._id === feedId && f.type === "poll" && f.options) {
                            return {
                                ...f,
                                options: f.options.map((option: any) => {
                                    if (option.id === optionId) {
                                        return { ...option, votes: (option.votes || 0) + 1 };
                                    }
                                    return option;
                                }),
                            };
                        }
                        return f;
                    }),
                }));
                try {
                    const response = await Post<{
                        success: boolean;
                        message: string;
                        totalVotes: number;
                        results: {
                            optionId: string;
                            optionName: string;
                            voteCount: number;
                            percentage: number;
                        }[];
                        userVote: { userId: string; optionId: string };
                        code: number;
                    }>(`/api/feed/vote/${feedId}`, { userId, optionId });
                    if (response?.code === 200 && response.success) {
                        set((state) => ({
                            feeds: state.feeds.map((f) => {
                                if (f._id === feedId && f.type === "poll" && f.options) {
                                    return {
                                        ...f,
                                        options: f.options.map((option: any) => {
                                            const result = response.results.find(
                                                (r) => r.optionId === option.id || r.optionName === option.name,
                                            );
                                            if (result) {
                                                return { ...option, votes: result.voteCount, percentage: result.percentage };
                                            }
                                            return option;
                                        }),
                                        totalVotes: response.totalVotes,
                                        votes: [
                                            ...(f.votes || []).filter((v: any) => {
                                                const vid =
                                                    typeof v.userId === "string"
                                                        ? v.userId
                                                        : v.userId?._id ?? v.userId?.toString();
                                                return vid !== userId;
                                            }),
                                            { userId, optionId },
                                        ],
                                    };
                                }
                                return f;
                            }),
                        }));
                    } else {
                        set((state) => ({
                            feeds: state.feeds.map((f) => {
                                if (f._id === feedId && f.type === "poll" && f.options) {
                                    return {
                                        ...f,
                                        options: f.options.map((option: any) => {
                                            if (option.id === optionId) {
                                                return { ...option, votes: Math.max((option.votes || 1) - 1, 0) };
                                            }
                                            return option;
                                        }),
                                    };
                                }
                                return f;
                            }),
                            error: response?.message || "Failed to submit vote",
                        }));
                    }
                } catch (error) {
                    console.error("Poll voting error:", error);
                    set((state) => ({
                        feeds: state.feeds.map((f) => {
                            if (f._id === feedId && f.type === "poll" && f.options) {
                                return {
                                    ...f,
                                    options: f.options.map((option: any) => {
                                        if (option.id === optionId) {
                                            return { ...option, votes: Math.max((option.votes || 1) - 1, 0) };
                                        }
                                        return option;
                                    }),
                                };
                            }
                            return f;
                        }),
                        error: "Failed to submit vote",
                    }));
                }
            },
            addOrUpdateRSVP: async (feedId: string, rsvpData: RsvpUser) => {
                set({ loading: true, error: null });
                set((state) => ({
                    feeds: state.feeds.map((f) =>
                        f._id === feedId
                            ? {
                                ...f,
                                rsvps: (f.rsvps || []).map((r) =>
                                    r.userId === rsvpData.userId ? { ...r, ...rsvpData } : r,
                                ),
                            }
                            : f,
                    ),
                    feedItem:
                        state.feedItem?._id === feedId
                            ? {
                                ...state.feedItem,
                                rsvps: (state.feedItem.rsvps || []).map((r) =>
                                    r.userId === rsvpData.userId ? { ...r, ...rsvpData } : r,
                                ),
                            }
                            : state.feedItem,
                }));
                try {
                    const response = await Post<{
                        success: boolean;
                        code: number;
                        rsvps: RsvpUser[];
                        message: string;
                    }>(`/api/feed/rsvp/${feedId}`, rsvpData);
                    // console.log("addOrUpdateRSVP response:", response);
                    if (response?.success && response?.code === 200) {
                        set((state) => ({
                            feeds: state.feeds.map((f) =>
                                f._id === feedId ? { ...f, rsvps: response.rsvps } : f,
                            ),
                            feedItem:
                                state.feedItem?._id === feedId
                                    ? { ...state.feedItem, rsvps: response.rsvps }
                                    : state.feedItem,
                            loading: false,
                        }));
                    } else {
                        set({ error: response?.message || "Failed to add or update RSVP", loading: false });
                    }
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to add or update RSVP",
                        loading: false,
                    });
                }
            },
            removeRSVP: async (feedId: string, userId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Delete<{
                        success: boolean;
                        code: number;
                        message: string;
                        rsvps: RsvpUser[];
                        registeredParticipants: number;
                    }>(`/api/feed/rsvp/${feedId}`, { userId });
                    if (response?.success && response?.code === 200) {
                        set((state) => ({
                            feeds: state.feeds.map((f) =>
                                f._id === feedId
                                    ? { ...f, rsvps: response.rsvps, registeredParticipants: response.registeredParticipants }
                                    : f,
                            ),
                            feedItem:
                                state.feedItem?._id === feedId
                                    ? { ...state.feedItem, rsvps: response.rsvps, registeredParticipants: response.registeredParticipants }
                                    : state.feedItem,
                            loading: false,
                        }));
                    } else {
                        set({ error: response?.message || "Failed to remove RSVP", loading: false });
                    }
                } catch (error) {
                    console.error("removeRSVP error:", error);
                    set({
                        error: error instanceof Error ? error.message : "Failed to remove RSVP",
                        loading: false,
                    });
                }
            },
            reportFeed: async (feedId: string, userId: string, reason: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        success: boolean;
                        code: number;
                        message: string;
                        totalReportCount: number;
                        reports: ReportItem[];
                    }>(`/api/feed/report/${feedId}`, { userId, reason });
                    if (response?.success && response?.code === 200) {
                        set((state) => ({
                            feeds: state.feeds.map((f) =>
                                f._id === feedId
                                    ? { ...f, report: response.reports, totalReportCount: response.totalReportCount }
                                    : f,
                            ),
                            feedItem:
                                state.feedItem?._id === feedId
                                    ? { ...state.feedItem, report: response.reports, totalReportCount: response.totalReportCount }
                                    : state.feedItem,
                            loading: false,
                        }));
                    } else {
                        const errorMsg = response?.message || "Failed to report feed";
                        set({ error: errorMsg, loading: false });
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Failed to report feed";
                    set({ error: errorMsg, loading: false });
                    throw error;
                }
            },
            addReview: async (feedId: string, reviewData: { userId: string; rating: number; comment: string }) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        success: boolean;
                        code: number;
                        message: string;
                        reviews: any[];
                    }>(`/api/feed/review/${feedId}`, reviewData);
                    if (response?.success && response?.code === 200) {
                        set((state) => ({
                            feeds: state.feeds.map((f) =>
                                f._id === feedId ? { ...f, reviews: response.reviews } : f,
                            ),
                            feedItem:
                                state.feedItem?._id === feedId
                                    ? { ...state.feedItem, reviews: response.reviews }
                                    : state.feedItem,
                            loading: false,
                        }));
                    } else {
                        set({ error: response?.message || "Failed to add review", loading: false });
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Failed to add review";
                    set({ error: errorMsg, loading: false });
                    throw error;
                }
            },
            clear: () => set({
                feeds: [],
                feedItem: undefined,
                feedsByUser: [],
                loading: false,
                error: null,
                lastFetchedAt: null,
                cachedSocietyId: null,
            }),
        }),
        {
            name: "feeds-store",
            // Use the shared adapter, not AsyncStorage directly — it guards the
            // `window is not defined` throw on web/SSR.
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                feeds: state.feeds,
                lastFetchedAt: state.lastFetchedAt,
                cachedSocietyId: state.cachedSocietyId,
            }),
        }
    )
);