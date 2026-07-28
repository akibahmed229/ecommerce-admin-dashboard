import { eq } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { RoleRepository } from "../infrastructure/persistence/role.repository.impl";
import { CreateRoleInput, UpdateRoleInput } from "../domain/role.entity";
import { PaginationOptions } from "@core/types/pagination";
import { ConflictError, ForbiddenError, NotFoundError } from "@core/errors/AppError";
import { permissionsTable } from "@core/database/schema";

const repo = new RoleRepository();
const CRITICAL_PERMISSION = "role:update";

async function resolvePermissionIds(input: { permissionIds?: string[]; grantAll?: boolean }) {
    if (input.grantAll) {
        const all = await db.select({ id: permissionsTable.id }).from(permissionsTable);
        return all.map((p) => p.id);
    }
    return input.permissionIds;
}

async function permissionIdFor(name: string) {
    const [permission] = await db.select().from(permissionsTable).where(eq(permissionsTable.name, name));
    return permission?.id;
}

export const roleService = {
    list: (options: PaginationOptions) => repo.findAll(options),

    async get(id: string) {
        const role = await repo.findById(id);
        if (!role) throw new NotFoundError("Role not found");
        return role;
    },

    async create(input: CreateRoleInput & { grantAll?: boolean }) {
        if (await repo.findByName(input.name)) throw new ConflictError("A role with this name already exists");
        const permissionIds = (await resolvePermissionIds(input)) ?? [];
        return repo.create({ ...input, permissionIds });
    },

    async update(id: string, input: UpdateRoleInput & { grantAll?: boolean }) {
        const existing = await repo.findById(id);
        if (!existing) throw new NotFoundError("Role not found");

        const permissionIds = await resolvePermissionIds(input);

        if (permissionIds !== undefined) {
            const criticalId = await permissionIdFor(CRITICAL_PERMISSION);
            const hadIt = existing.permissions.some((p) => p.name === CRITICAL_PERMISSION);
            const willHaveIt = criticalId ? permissionIds.includes(criticalId) : false;

            if (hadIt && !willHaveIt) {
                const otherHolders = await repo.countRolesHoldingPermission(CRITICAL_PERMISSION, id);
                if (otherHolders === 0) {
                    throw new ForbiddenError(`Cannot remove "${CRITICAL_PERMISSION}" — no other role would be left able to manage roles`);
                }
            }
        }

        return repo.update(id, { ...input, permissionIds });
    },

    async remove(id: string) {
        const userCount = await repo.countUsersWithRole(id);
        if (userCount > 0) throw new ConflictError(`Cannot delete role — ${userCount} user(s) still hold it`);
        if (!(await repo.delete(id))) throw new NotFoundError("Role not found");
        return true;
    },
};
