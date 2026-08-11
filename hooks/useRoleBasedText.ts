import { UserRole } from "@/types/roles";
import { usePermissions } from "./usePermissions";

type RoleTextMap = {
    [key in UserRole]?: string;
};

export const useRoleBasedText = () => {
    const { roles, highestRole } = usePermissions();

    const getText = (textMap: RoleTextMap, defaultText: string = ""): string => {
        // First try to match the highest role
        const highest = highestRole();
        if (textMap[highest]) {
            return textMap[highest];
        }

        // If no match for highest role, try each role in order
        for (const role of roles) {
            if (textMap[role]) {
                return textMap[role];
            }
        }

        // Return default text if no matches found
        return defaultText;
    };

    const getButtonText = (action: string): string => {
        const textMap: RoleTextMap = {
            [UserRole.ADMIN]: `Manage ${action}`,
            [UserRole.BUSINESS]: `Create ${action}`,
            [UserRole.RESIDENT]: `Register ${action}`,
            [UserRole.GUEST]: `Register as ${action}`,
        };
        return getText(textMap, `Create ${action}`);
    };

    const getActionText = (resource: string, prefix: string = ""): string => {
        const textMap: RoleTextMap = {
            [UserRole.ADMIN]: `${prefix} ${resource}`,
            [UserRole.BUSINESS]: `${prefix} ${resource}`,
            [UserRole.RESIDENT]: `${prefix} ${resource}`,
            [UserRole.SUPER_ADMIN]: `${prefix} ${resource}`,
            [UserRole.GUEST]: `Register as a ${resource}`,
        };
        return getText(textMap, `Create ${resource}`);
    };

    return {
        getText,
        getButtonText,
        getActionText,
    };
};