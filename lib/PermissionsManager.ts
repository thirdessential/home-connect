import { ActionType, DEFAULT_PERMISSIONS, ResourceType } from "@/types/permissions";
import { UserRole } from "@/types/roles";

type PermissionRule = {
    roles: UserRole[];
    conditions?: (context: any) => boolean;
};

type ResourcePermissions = {
    [key in ActionType]?: PermissionRule;
};

type PermissionsConfig = {
    [key in ResourceType]?: ResourcePermissions;
};

export class PermissionsManager {
    private permissions: PermissionsConfig = {};

    constructor(initialPermissions?: PermissionsConfig) {
        this.permissions = initialPermissions || {};
    }

    /**
     * Factory: builds a PermissionsManager pre-loaded from DEFAULT_PERMISSIONS.
     * This is the recommended way to create the singleton used app-wide.
     */
    static fromDefaults(): PermissionsManager {
        const manager = new PermissionsManager();
        for (const resource of Object.keys(DEFAULT_PERMISSIONS) as ResourceType[]) {
            const actions = DEFAULT_PERMISSIONS[resource];
            for (const action of Object.keys(actions) as ActionType[]) {
                const roles = actions[action];
                if (roles) {
                    manager.addPermission(resource, action, roles);
                }
            }
        }
        return manager;
    }

    addPermission(
        resource: ResourceType,
        action: ActionType,
        roles: UserRole[],
        conditions?: (context: any) => boolean
    ) {
        if (!this.permissions[resource]) {
            this.permissions[resource] = {};
        }
        this.permissions[resource]![action] = { roles, conditions };
    }

    can(userRoles: UserRole[], action: ActionType, resource: ResourceType, context?: any): boolean {
        const resourcePermissions = this.permissions[resource];
        if (!resourcePermissions) {
            return this.getDefaultPermission(action, userRoles);
        }

        const permission = resourcePermissions[action];
        if (!permission) {
            return this.getDefaultPermission(action, userRoles);
        }

        const hasRole = userRoles.some(role => permission.roles.includes(role));
        if (!hasRole) return false;

        if (permission.conditions && context) {
            return permission.conditions(context);
        }

        return true;
    }

    private getDefaultPermission(action: ActionType, userRoles: UserRole[]): boolean {
        // Default permissions logic
        if (action === ActionType.READ) {
            return !userRoles.includes(UserRole.GUEST);
        }
        return userRoles.includes(UserRole.ADMIN);
    }
}