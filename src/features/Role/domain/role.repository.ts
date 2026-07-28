import {
    Role,
    RoleWithPermissions,
    CreateRoleInput,
    UpdateRoleInput,
} from "./role.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";

export interface IRoleRepository {
    findById(id: string): Promise<RoleWithPermissions | null>;

    findByName(name: string): Promise<Role | null>;

    findAll(
        options: PaginationOptions
    ): Promise<PaginatedResult<RoleWithPermissions>>;

    create(input: CreateRoleInput): Promise<RoleWithPermissions>;

    update(id: string, input: UpdateRoleInput): Promise<RoleWithPermissions>;

    delete(id: string): Promise<boolean>;

    countUsersWithRole(roleId: string): Promise<number>;

    // Metric for last-admin guard: count how many roles hold a given permission (e.g., 'role:update')
    countRolesHoldingPermission(
        permissionName: string,
        excludeRoleId?: string
    ): Promise<number>;
}
