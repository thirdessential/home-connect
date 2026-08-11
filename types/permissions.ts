import { UserRole } from "./roles";

export enum ResourceType {
    POST = "post",
    POLL = "poll",
    EVENT = "event",
    BUSINESS = "business",
    WHOLESALE_DEAL = "wholesaleDeal",
    DAILY_HELP_SERVICE = "dailyHelpService",
    RESIDENT = "resident",
    PRODUCT = "product",
    SERVICE = "service",
    ADMIN_PANEL = "adminPanel",
}

export enum ActionType {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    ACCESS = "access",
}

/**
 * SINGLE SOURCE OF TRUTH for role-based permissions.
 * Edit this object to change what each role can do across the entire app.
 *
 * Structure: DEFAULT_PERMISSIONS[resource][action] = array of allowed roles
 */
export const DEFAULT_PERMISSIONS: Record<ResourceType, Partial<Record<ActionType, UserRole[]>>> = {
    [ResourceType.POST]: {
        [ActionType.CREATE]: [UserRole.RESIDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.POLL]: {
        [ActionType.CREATE]: [UserRole.RESIDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.EVENT]: {
        [ActionType.CREATE]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.BUSINESS]: {
        [ActionType.CREATE]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.WHOLESALE_DEAL]: {
        [ActionType.CREATE]: [UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.DAILY_HELP_SERVICE]: {
        [ActionType.CREATE]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.RESIDENT]: {
        [ActionType.CREATE]: [UserRole.GUEST, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.PRODUCT]: {
        [ActionType.CREATE]: [UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.SERVICE]: {
        [ActionType.CREATE]: [UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.READ]: [UserRole.GUEST, UserRole.RESIDENT, UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.UPDATE]: [UserRole.BUSINESS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        [ActionType.DELETE]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    [ResourceType.ADMIN_PANEL]: {
        [ActionType.ACCESS]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
};