import { verificationStatus } from "@/assets/enums/common.enum";
import { PermissionsManager } from "@/lib/PermissionsManager";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";
import { ActionType, ResourceType } from "@/types/permissions";
import { UserRole } from "@/types/roles";
import { useCallback, useMemo } from "react";

// Singleton permissions manager pre-loaded from DEFAULT_PERMISSIONS (types/permissions.ts)
const permissionsManager = PermissionsManager.fromDefaults();

/**
 * A utility hook for role-based permissions
 */
export const usePermissions = () => {
    // Use selector instead of full store destructure to avoid re-renders on unrelated auth changes
    const roles = useAuthStore((state) => state.roles);
    const addressVerified = useUserStore((state) => state.isAddressVerified);
    const isResidentVerified =
        addressVerified?.status === verificationStatus.APPROVED;
    const userRoles = useMemo(() => (roles || [UserRole.GUEST]) as UserRole[], [roles]);

    const hasRole = useCallback((requiredRoles: UserRole | UserRole[]): boolean => {
        if (!userRoles.length) return false;
        const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return rolesToCheck.some(role => userRoles.includes(role));
    }, [userRoles]);

    const hasAnyRole = useCallback((requiredRoles: UserRole[]): boolean =>
        requiredRoles.some(role => userRoles.includes(role as UserRole)),
        [userRoles]);

    const hasOnly = useCallback((requiredRoles: UserRole[]): boolean =>
        userRoles.length === requiredRoles.length &&
        userRoles.every(role => requiredRoles.includes(role)),
        [userRoles]);

    const hasAllRoles = useCallback((requiredRoles: UserRole[]): boolean =>
        requiredRoles.every(role => userRoles.includes(role as UserRole)),
        [userRoles]);

    const can = useCallback((action: ActionType, resource: ResourceType, context?: any): boolean => {
        if (userRoles.includes(UserRole.ADMIN)) return true;
        return permissionsManager.can(userRoles, action, resource, context);
    }, [userRoles]);

    const highestRole = useCallback((): UserRole => {
        const roleHierarchy = [
            UserRole.GUEST,
            UserRole.RESIDENT,
            UserRole.BUSINESS,
            UserRole.ADMIN,
            UserRole.SUPER_ADMIN
        ];
        return roleHierarchy.reduce((highest, role) =>
            userRoles.includes(role) &&
                roleHierarchy.indexOf(role) > roleHierarchy.indexOf(highest)
                ? role
                : highest
            , UserRole.GUEST);
    }, [userRoles]);

    const isUserAllowed = useCallback((): boolean => {
        const isNotGuest = !userRoles.includes(UserRole.GUEST);
        const status = addressVerified?.status;
        const isPendingOrRejected =
            status === verificationStatus.PENDING ||
            status === verificationStatus.REJECTED;
        return isNotGuest && isPendingOrRejected;
    }, [userRoles, addressVerified]);

    return {
        hasRole,
        hasAnyRole,
        hasOnly,
        hasAllRoles,
        can,
        highestRole,
        roles: userRoles,
        isAuthenticated: !userRoles.includes(UserRole.GUEST),
        isResidentVerified,
        isUserAllowed: isUserAllowed(),
    };
};