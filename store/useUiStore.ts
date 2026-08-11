import { create } from "zustand";

export type CreatePostInitialForm =
    | null
    | "post"
    | "poll"
    | "event"
    | "service"
    | "createWholesaleDeal"
    | "createBusiness";

export interface UIStore {
    createPostModal: {
        visible: boolean;
        initialForm: CreatePostInitialForm;
    };
    openCreatePostModal: (initialForm?: CreatePostInitialForm) => void;
    closeCreatePostModal: () => void;

    isSocietySwitching: boolean;
    setSocietySwitching: (loading: boolean) => void;
}

export const useUiStore = create<UIStore>((set) => ({
    createPostModal: {
        visible: false,
        initialForm: null,
    },
    openCreatePostModal: (initialForm = null) =>
        set(() => ({ createPostModal: { visible: true, initialForm } })),
    closeCreatePostModal: () =>
        set(() => ({ createPostModal: { visible: false, initialForm: null } })),

    isSocietySwitching: false,
    setSocietySwitching: (loading: boolean) => set(() => ({ isSocietySwitching: loading })),
}));
