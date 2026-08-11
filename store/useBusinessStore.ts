import { Get, Patch, Post, Put } from "@/lib/httpMethods";
import { BusinessCatalogue, Product, ProductStore, ReportItem } from "@/types/business.type";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useProductStore = create<ProductStore>()(
    persist(
        (set, get) => ({
            product: null,
            productList: null,
            userProducts: null,
            businessReviews: {} as Record<string, any[]>,
            pendingReq: 0,
            pendingBusinessReq: 0,
            totalCount: 0,
            loading: false,
            error: null,
            _hasHydrated: false,

            setProduct: (product) => set({ productList: product ? Array.isArray(product) ? product : [product] : null }),
            createProduct: async (product: Partial<Product>) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{ code: number; product?: Product; business?: Product, message?: string }>(`/api/business`, product);
                    if (response?.code === 201) {
                        if (response.product) {
                            set((state) => ({
                                product: response.product!,
                                userProducts: state.userProducts
                                    ? [...state.userProducts, response.product!]
                                    : [response.product!],
                                loading: false,
                            }));
                        } else if (response.business) {
                            set((state) => ({
                                product: response.business!,
                                userProducts: state.userProducts
                                    ? [...state.userProducts, response.business!]
                                    : [response.business!],
                                loading: false,
                            }));
                        } else {
                            set({ product: null, loading: false });
                        }
                    } else {
                        set({ error: response?.message || "Failed to create product", loading: false });
                    }
                } catch (error: any) {
                    set({ error: "Failed to create product", loading: false });
                    throw (error?.message || "Failed to create product");
                }
            },
            updateProduct: async (productUpdate: Partial<Product>, productId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Patch<{ code: number; product?: Product; business?: Product }>(`/api/business/${productId}`, productUpdate);
                    if (response?.code === 200) {
                        // API may return 'product' or 'business'
                        const updatedProduct = response.product || response.business;
                        if (updatedProduct) {
                            // Update productList - replace the updated product in the list
                            const currentList = get().productList;
                            const updatedList = currentList
                                ? currentList.map((p) =>
                                    p._id === productId ? { ...p, ...updatedProduct } : p
                                )
                                : null;
                            // Also update userProducts if exists
                            const currentUserProducts = get().userProducts;
                            const updatedUserProducts = currentUserProducts
                                ? currentUserProducts.map((p) =>
                                    p._id === productId ? { ...p, ...updatedProduct } : p
                                )
                                : null;
                            set({
                                product: updatedProduct,
                                productList: updatedList,
                                userProducts: updatedUserProducts,
                                loading: false,
                            });
                        } else {
                            // No product in response, just update with the sent data locally
                            const currentList = get().productList;
                            const updatedList = currentList
                                ? currentList.map((p) =>
                                    p._id === productId ? { ...p, ...productUpdate } : p
                                )
                                : null;
                            const currentUserProducts = get().userProducts;
                            const updatedUserProducts = currentUserProducts
                                ? currentUserProducts.map((p) =>
                                    p._id === productId ? { ...p, ...productUpdate } : p
                                )
                                : null;
                            set({
                                productList: updatedList,
                                userProducts: updatedUserProducts,
                                loading: false,
                            });
                        }
                    } else {
                        set({ error: "Failed to update product", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to update product", loading: false });
                }
            },
            fetchBusinessBySocietyId: async (societyId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; businesses: Product[], pendingReq: number, totalCount: number }>(`/api/business/fetch/${societyId}`);
                    if (response?.success && Array.isArray(response.businesses)) {
                        // Initialize businessReviews from all businesses
                        const businessReviewsUpdate = { ...get().businessReviews };
                        response.businesses.forEach((business) => {
                            if (business._id && business.reviews && Array.isArray(business.reviews)) {
                                businessReviewsUpdate[business._id] = business.reviews;
                            }
                        });
                        set({ productList: response.businesses, businessReviews: businessReviewsUpdate, pendingReq: response.pendingReq, totalCount: response.totalCount, loading: false });
                    } else {
                        set({ error: "Failed to fetch product", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch product", loading: false });
                }
            },
            getUserBusinesses: async (userId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; businesses: Product[], count: number, pendingReq: number }>(`/api/business/user/${userId}`);
                    if (response?.success && Array.isArray(response.businesses)) {
                        // Initialize businessReviews from all businesses
                        const businessReviewsUpdate = { ...get().businessReviews };
                        response.businesses.forEach((business) => {
                            if (business._id && business.reviews && Array.isArray(business.reviews)) {
                                businessReviewsUpdate[business._id] = business.reviews;
                            }
                        });
                        set({ userProducts: response.businesses, businessReviews: businessReviewsUpdate, totalCount: response.count, loading: false, pendingBusinessReq: response.pendingReq });
                    } else {
                        set({ error: "Failed to fetch product", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch product", loading: false });
                }
            },
            getProductById: async (productId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; product?: Product; business?: Product }>(`/api/business/product/${productId}`);
                    const data = response?.product ?? response?.business;
                    if (response?.success && data) {
                        // Initialize businessReviews from product.reviews
                        const businessReviewsUpdate = { ...get().businessReviews };
                        if (data.reviews && Array.isArray(data.reviews)) {
                            businessReviewsUpdate[productId] = data.reviews;
                        }
                        set({ product: data, businessReviews: businessReviewsUpdate, loading: false });
                    } else {
                        set({ error: "Failed to fetch product", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch product", loading: false });
                }
            },
            getAllBusinesses: async (societyId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; businesses: Product[] }>(`/api/business/all/${societyId}`);
                    if (response?.success && Array.isArray(response.businesses)) {
                        // Initialize businessReviews from all businesses
                        const businessReviewsUpdate = { ...get().businessReviews };
                        response.businesses.forEach((business) => {
                            if (business._id && business.reviews && Array.isArray(business.reviews)) {
                                businessReviewsUpdate[business._id] = business.reviews;
                            }
                        });
                        set({ productList: response.businesses, businessReviews: businessReviewsUpdate, loading: false });
                    } else {
                        set({ error: "Failed to fetch businesses", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch businesses", loading: false });
                }
            },
            addCatalogueItem: async (businessId: string, catalogue: BusinessCatalogue) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{ code: number; catalogue: BusinessCatalogue }>(`/api/business/${businessId}/catalogue`, catalogue);
                    if (response?.code === 201 && response.catalogue) {
                        // Immediately add the new item to the catalogue list
                        const current = get();
                        const currentCatalogue = current.product?.catalogue || [];
                        set({
                            product: current.product
                                ? { ...current.product, catalogue: [...currentCatalogue, response.catalogue] }
                                : { catalogue: [response.catalogue] },
                            loading: false
                        });
                    } else {
                        set({ error: "Failed to add catalogue item", loading: false });
                    }
                } catch (error: any) {
                    set({ error: error?.message || "Failed to add catalogue item", loading: false });
                }
            },
            getCatalogueByBusinessId: async (businessId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; catalogue: BusinessCatalogue[] }>(`/api/business/${businessId}/catalogue`);
                    if (response?.success && Array.isArray(response.catalogue)) {
                        const current = get();
                        set({
                            product: current.product
                                ? { ...(current.product as any), catalogue: response.catalogue }
                                : { catalogue: response.catalogue },
                            loading: false
                        });
                    } else {
                        set({ error: "Failed to fetch catalogue", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch catalogue", loading: false });
                }
            },
            updateCatalogueItem: async (businessId: string, catalogueId: string, catalogue: Partial<BusinessCatalogue>) => {
                set({ loading: true, error: null });
                try {
                    const response = await Put<{ code: number; catalogue: BusinessCatalogue }>(`/api/business/${businessId}/catalogue/${catalogueId}`, catalogue);
                    if (response?.code === 200 && response.catalogue) {
                        const current = get();
                        const updatedCatalogue = current.product?.catalogue?.map((item) =>
                            item._id === catalogueId ? { ...item, ...response.catalogue } : item
                        );
                        set({
                            product: current.product
                                ? { ...current.product, catalogue: updatedCatalogue }
                                : current.product,
                            loading: false
                        });
                    } else {
                        set({ error: "Failed to update catalogue item", loading: false });
                    }
                } catch (error: any) {
                    set({ error: error?.message || "Failed to update catalogue item", loading: false });
                }
            },
            addOrUpdateBusinessReview: async (businessId: string, userId: string, reviewData: { rating: number; comment: string; userName?: string, profilePhotoUrl?: string }) => {
                try {
                    // // Create optimistic review object with unique temporary ID
                    // const uniqueTempId = `temp_${Date.now()}_${++tempIdCounter}`;
                    // const optimisticReview = {
                    //     _id: uniqueTempId,
                    //     userName: reviewData.userName || "Anonymous",
                    //     profilePhotoUrl: reviewData.profilePhotoUrl || "",
                    //     rating: reviewData.rating,
                    //     comment: reviewData.comment,
                    //     createdAt: new Date().toISOString(),
                    // };

                    // // Optimistically update the store immediately
                    // const currentReviews = get().businessReviews[businessId] || [];
                    // const optimisticReviews = [optimisticReview, ...currentReviews];

                    // set({
                    //     businessReviews: {
                    //         ...get().businessReviews,
                    //         [businessId]: optimisticReviews,
                    //     },
                    // });

                    // Make API call in the background
                    const response = await Post<{ success: boolean; code: number; review: any; message: string; avgRating: number; totalReviews: number }>(`/api/business/${businessId}/review`, {
                        userId,
                        ...reviewData,
                    });

                    if (response?.success) {
                        // Replace optimistic review with actual review from backend
                        // const filteredReviews = updatedReviews.filter((r) => r._id !== optimisticReview._id);
                        // const finalReviews = [response.review, ...filteredReviews];

                        // Update store with final reviews
                        // set({
                        //     businessReviews: {
                        //         ...get().businessReviews,
                        //         [businessId]: finalReviews,
                        //     },
                        // });

                        // Update business with new rating and reviews count
                        // const businessUpdate: Partial<any> = {
                        //     reviews: finalReviews,
                        // };

                        // Call updateProduct to sync with backend
                        // await get().updateProduct(businessUpdate, businessId);

                        return response.review;
                    } else {
                        // Remove optimistic review if API fails
                        // const updatedReviews = get().businessReviews[businessId] || [];
                        // const filteredReviews = updatedReviews.filter((r) => r._id !== optimisticReview._id);
                        // set({
                        //     businessReviews: {
                        //         ...get().businessReviews,
                        //         [businessId]: filteredReviews,
                        //     },
                        //     error: "Failed to add/update review",
                        // });
                        return null;
                    }
                } catch (error: any) {
                    set({ error: error?.message || "Failed to add/update review" });
                    return null;
                }
            },
            reportBusiness: async (businessId: string, userId: string, reason: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        success: boolean;
                        code: number;
                        message: string;
                        totalReportCount: number;
                        reports: ReportItem[];
                    }>(
                        `/api/business/report/${businessId}`,
                        { userId, reason }
                    );

                    if (response?.success && response?.code === 200) {
                        // Update the product with the new report count and reports
                        set((state) => ({
                            product: state.product?._id === businessId
                                ? {
                                    ...state.product,
                                    report: response.reports,
                                    totalReportCount: response.totalReportCount
                                }
                                : state.product,
                            productList: state.productList
                                ? state.productList.map((p) =>
                                    p._id === businessId
                                        ? {
                                            ...p,
                                            report: response.reports,
                                            totalReportCount: response.totalReportCount
                                        }
                                        : p
                                )
                                : state.productList,
                            userProducts: state.userProducts
                                ? state.userProducts.map((p) =>
                                    p._id === businessId
                                        ? {
                                            ...p,
                                            report: response.reports,
                                            totalReportCount: response.totalReportCount
                                        }
                                        : p
                                )
                                : state.userProducts,
                            loading: false,
                        }));
                    } else {
                        const errorMsg = response?.message || "Failed to report business";
                        set({ error: errorMsg, loading: false });
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Failed to report business";
                    set({ error: errorMsg, loading: false });
                    throw error;
                }
            },
            updateBusinessVerificationStatus: async (businessId: string, userId: string, status: string, rejectionReason?: string) => {
                set({ loading: true, error: null });
                try {
                    const body: { userId: string; status: string; rejectionReason?: string } = { userId, status };
                    if (status === "rejected" && rejectionReason) {
                        body.rejectionReason = rejectionReason;
                    }

                    console.log("Updating business verification status with body:", body);
                    const response = await Patch<{
                        success: boolean;
                        code: number;
                        message: string;
                        business: { _id: string; verificationStatus: { status: string; rejectionReason: string | null } };
                    }>(`/api/business/${businessId}/status`, body);

                    if (response?.success && response?.code === 200) {
                        const updatedVerificationStatus = response.business.verificationStatus;
                        set((state) => ({
                            product: state.product?._id === businessId
                                ? { ...state.product, verificationStatus: updatedVerificationStatus }
                                : state.product,
                            productList: state.productList
                                ? state.productList.map((p) =>
                                    p._id === businessId
                                        ? { ...p, verificationStatus: updatedVerificationStatus }
                                        : p
                                )
                                : state.productList,
                            userProducts: state.userProducts
                                ? state.userProducts.map((p) =>
                                    p._id === businessId
                                        ? { ...p, verificationStatus: updatedVerificationStatus }
                                        : p
                                )
                                : state.userProducts,
                            loading: false,
                        }));
                    } else {
                        const errorMsg = response?.message || "Failed to update business status";
                        set({ error: errorMsg, loading: false });
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Failed to update business status";
                    set({ error: errorMsg, loading: false });
                    throw error;
                }
            },
            clear: () => set({ productList: null, product: null, userProducts: null, loading: false, error: null }),
            _setHasHydrated: (v) => set({ _hasHydrated: v }),
        }),
        {
            name: "product-store",
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({}),
            onRehydrateStorage: () => (state, err) => {
                state?._setHasHydrated(true);
                if (err) console.warn("Product rehydrate error", err);
            },
        }
    )
);