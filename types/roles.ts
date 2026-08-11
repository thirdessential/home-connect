export enum UserRole {
    GUEST = "guest",
    RESIDENT = "resident",
    BUSINESS = "business",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}

export const ROLE_HIERARCHY = [
    UserRole.GUEST,
    UserRole.RESIDENT,
    UserRole.BUSINESS,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
];

export enum UserType {
    RESIDENT = "resident",
    BUSINESS = "business",
    ADMIN = "admin",
    DEAL = "deal",
    SERVICE = "service"
}