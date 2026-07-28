import {
    PermissionGroup,
    Permission,
    PermissionGroupWithActions,
    CreatePermissionGroupInput,
    UpdatePermissionGroupInput,
} from "./permission.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";

export interface IPermissionRepository {
    findGroupById(id: string): Promise<PermissionGroupWithActions | null>;

    findGroupByName(name: string): Promise<PermissionGroup | null>;

    findAllGroups(
        options: PaginationOptions
    ): Promise<PaginatedResult<PermissionGroupWithActions>>;

    createGroupWithPermissions(
        input: CreatePermissionGroupInput
    ): Promise<PermissionGroupWithActions>;

    updateGroup(
        id: string,
        input: UpdatePermissionGroupInput
    ): Promise<PermissionGroup>;

    findPermissionByName(name: string): Promise<Permission | null>;

    addPermissionToGroup(
        groupId: string,
        name: string,
        description?: string
    ): Promise<Permission>;

    deletePermission(id: string): Promise<boolean>;

    deleteGroup(id: string): Promise<boolean>;
}
