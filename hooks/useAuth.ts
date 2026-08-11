import { User } from "@/store/auth.type";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";
import { Society } from "@/types/society.type";

/**
 * A hook to check user authentication status
 */
export const useAuth = () => {
    const { token, roles, setRoles, signOut } = useAuthStore();
    const { user, setUser, updateUserField } = useUserStore();
    const isLoggedIn = !!token && user && roles && !roles.includes("guest");

    return {
        isLoggedIn,
        isAuthenticated: isLoggedIn, // Alias for consistency
        user,
        roles: roles || [],

        /**
         * Update user's selected society
         * @param society The society or society ID to select
         */
        setSelectedSociety: (society: string | Society) => {
            if (!user) return;
            updateUserField('selected_society', society);
        },

        /**
         * Legacy method - use setSelectedSociety instead
         */
        updateSelectedSociety: (society: any) => {
            if (!user) return;
            updateUserField('selected_society', society);
        },

        /**
         * Mark user's address as verified
         */
        markAddressVerified: () => {
            if (!user) return;
            updateUserField('isAddressVerified', true);
        },

        /**
         * Add resident role to user
         */
        addResidentRole: () => {
            if (!roles) return;

            const currentRoles = [...roles];
            if (!currentRoles.includes("resident")) {
                // If user is guest, replace with resident, otherwise add resident role
                if (currentRoles.includes("guest")) {
                    const index = currentRoles.indexOf("guest");
                    currentRoles.splice(index, 1);
                }
                currentRoles.push("resident");
                setRoles(currentRoles);
            }
        },

        /**
         * Add business role to user
         */
        addBusinessRole: () => {
            if (!roles) return;

            const currentRoles = [...roles];
            if (!currentRoles.includes("business")) {
                currentRoles.push("business");
                setRoles(currentRoles);
            }
        },

        /**
         * Update user role
         * @param newRoles Array of new roles to assign
         */
        updateRole: (newRoles: string[]) => {
            setRoles(newRoles);
        },

        /**
         * Update user profile information
         * @param userData Partial user data to update
         */
        updateProfile: (userData: Partial<User>) => {
            if (!user) return;
            setUser({
                ...user,
                ...userData
            });
        },

        /**
         * Check if user has a society selected
         */
        hasSocietySelected: () => {
            return !!user?.selected_society;
        },

        /**
         * Check if user's address is verified
         */
        isAddressVerified: () => {
            return !!user?.isAddressVerified;
        },

        /**
         * Sign out user
         */
        logout: signOut,

        /**
         * Check if user has completed onboarding based on their roles
         */
        hasCompletedOnboarding: () => {
            if (!user) return false;

            // Check if resident has selected a society
            if (roles?.includes("resident")) {
                return !!(user as any).resident_info?.society_id;
            }

            // Check if business has entered business name
            if (roles?.includes("business")) {
                return !!(user as any).business_info?.business_name;
            }

            return false;
        }
    };
};
