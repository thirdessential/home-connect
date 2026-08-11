import { useCallback } from 'react';
import { useUiStore, type CreatePostInitialForm } from '../store/useUiStore';

// Public helper to control the globally mounted CreatePostModal
// Usage:
// const { open, openWithForm, close } = useCreatePostModal();
// open(); // opens with last/initial form
// openWithForm('post'); // opens and sets initial form
// close();
export function useCreatePostModal() {
    // Narrow selectors to avoid re-renders when unrelated UI state changes
    const openCreatePostModal = useUiStore((s) => s.openCreatePostModal);
    const closeCreatePostModal = useUiStore((s) => s.closeCreatePostModal);

    const open = useCallback(() => {
        openCreatePostModal();
    }, [openCreatePostModal]);

    const openWithForm = useCallback(
        (initialForm: CreatePostInitialForm) => {
            openCreatePostModal(initialForm);
        },
        [openCreatePostModal]
    );

    const close = useCallback(() => {
        closeCreatePostModal();
    }, [closeCreatePostModal]);

    return { open, openWithForm, close };
}
