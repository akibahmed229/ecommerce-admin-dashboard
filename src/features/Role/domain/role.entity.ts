import { Permission } from "@features/Permission/domain/permission.entity";

export type RoleStatus = "active" | "inactive";

export interface Role {
    id: string;
    name: string;
    description: string | null;
    status: RoleStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface RoleWithPermissions extends Role {
    permissions: Permission[];
    userCount?: number;
}

export interface CreateRoleInput {
    name: string;
    description?: string;
    status?: RoleStatus;
    permissionIds: string[];
}

export interface UpdateRoleInput {
    name?: string;
    description?: string;
    status?: RoleStatus;
    permissionIds?: string[];
}
