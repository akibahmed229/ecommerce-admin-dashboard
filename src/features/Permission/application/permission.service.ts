import { PermissionRepository } from "../infrastructure/persistence/permission.repository.impl";
import { CreatePermissionGroupInput, UpdatePermissionGroupInput } from "../domain/permission.entity";
import { PaginationOptions } from "@core/types/pagination";
import { ConflictError, NotFoundError } from "@core/errors/AppError";

const repo = new PermissionRepository();

export const permissionService = {
    list: (options: PaginationOptions) => repo.findAllGroups(options),

    async getGroup(id: string) {
        const group = await repo.findGroupById(id);
        if (!group) throw new NotFoundError("Permission group not found");
        return group;
    },

    async createGroup(input: CreatePermissionGroupInput) {
        if (await repo.findGroupByName(input.name)) throw new ConflictError("A permission group with this name already exists");
        return repo.createGroupWithPermissions(input);
    },

    async updateGroup(id: string, input: UpdatePermissionGroupInput) {
        if (!(await repo.findGroupById(id))) throw new NotFoundError("Permission group not found");
        return repo.updateGroup(id, input);
    },

    async addAction(groupId: string, name: string, description?: string) {
        if (!(await repo.findGroupById(groupId))) throw new NotFoundError("Permission group not found");
        return repo.addPermissionToGroup(groupId, name, description);
    },

    async deletePermission(id: string) {
        if (!(await repo.deletePermission(id))) throw new NotFoundError("Permission not found");
        return true;
    },

    async deleteGroup(id: string) {
        if (!(await repo.deleteGroup(id))) throw new NotFoundError("Permission group not found");
        return true;
    },
};
