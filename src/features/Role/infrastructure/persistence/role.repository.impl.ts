import { eq, ilike, count } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { IRoleRepository } from "@features/Role/domain/role.repository";
import { Role, RoleWithPermissions, CreateRoleInput, UpdateRoleInput } from "@features/Role/domain/role.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";
import { NotFoundError } from "@core/errors/AppError";
import { permissionsTable, rolePermissionsTable, rolesTable, usersTable } from "@core/database/schema";

export class RoleRepository implements IRoleRepository {
    private async getPermissions(roleId: string, executor: any = db) {
        return executor
            .select(
                {
                    id: permissionsTable.id,
                    groupId: permissionsTable.groupId,
                    name: permissionsTable.name,
                    description: permissionsTable.description,
                    createdAt: permissionsTable.createdAt,
                    updatedAt: permissionsTable.updatedAt
                }
            )
            .from(rolePermissionsTable)
            .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionsTable.permissionId))
            .where(eq(rolePermissionsTable.roleId, roleId));
    }

    private async userCount(roleId: string, executor: any = db) {
        const [{ value }] = await executor
            .select({ value: count() })
            .from(usersTable)
            .where(eq(usersTable.roleId, roleId));

        return value;
    }

    async findById(id: string): Promise<RoleWithPermissions | null> {
        const [role] = await db
            .select().from(rolesTable)
            .where(eq(rolesTable.id, id));

        if (!role) return null;

        return {
            ...role,
            permissions: await this.getPermissions(id),
            userCount: await this.userCount(id)
        };
    }

    async findByName(name: string): Promise<Role | null> {
        const [role] = await db
            .select().from(rolesTable)
            .where(eq(rolesTable.name, name));

        return role ?? null;
    }

    async findAll(options: PaginationOptions): Promise<PaginatedResult<RoleWithPermissions>> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const offset = (page - 1) * limit;
        const whereClause = options.search ? ilike(rolesTable.name, `%${options.search}%`) : undefined;

        const rows = await db
            .select().from(rolesTable)
            .where(whereClause)
            .limit(limit)
            .offset(offset);

        const [{ value: total }] = await db
            .select({ value: count() })
            .from(rolesTable).where(whereClause);

        const data: RoleWithPermissions[] = [];

        for (const role of rows) {
            data.push(
                {
                    ...role,
                    permissions: await this.getPermissions(role.id),
                    userCount: await this.userCount(role.id)
                }
            );
        }

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async create(input: CreateRoleInput): Promise<RoleWithPermissions> {
        return db.transaction(async (tx: any) => {
            const [role] = await tx
                .insert(rolesTable)
                .values(
                    {
                        name: input.name,
                        description: input.description,
                        status: input.status ?? "active"
                    }
                )
                .returning();

            if (input.permissionIds.length) {
                await tx
                    .insert(rolePermissionsTable)
                    .values(input.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })));
            }

            return { ...role, permissions: await this.getPermissions(role.id, tx), userCount: 0 };
        });
    }

    async update(id: string, input: UpdateRoleInput): Promise<RoleWithPermissions> {
        return db.transaction(async (tx: any) => {
            const [existing] = await tx
                .select()
                .from(rolesTable)
                .where(eq(rolesTable.id, id));

            if (!existing) throw new NotFoundError("Role not found");

            if (input.name !== undefined || input.description !== undefined || input.status !== undefined) {
                await tx
                    .update(rolesTable)
                    .set(
                        {
                            name: input.name,
                            description: input.description,
                            status: input.status, updatedAt: new Date()
                        }
                    )
                    .where(eq(rolesTable.id, id));
            }

            if (input.permissionIds) {
                await tx
                    .delete(rolePermissionsTable)
                    .where(eq(rolePermissionsTable.roleId, id));

                if (input.permissionIds.length) {
                    await tx
                        .insert(rolePermissionsTable)
                        .values(input.permissionIds.map((permissionId) => ({ roleId: id, permissionId })));
                }
            }

            const [role] = await tx
                .select()
                .from(rolesTable)
                .where(eq(rolesTable.id, id));

            return {
                ...role,
                permissions: await this.getPermissions(id, tx),
                userCount: await this.userCount(id, tx)
            };
        });
    }

    async delete(id: string): Promise<boolean> {
        const result = await db
            .delete(rolesTable)
            .where(eq(rolesTable.id, id))
            .returning({ id: rolesTable.id });

        return result.length > 0;
    }

    async countUsersWithRole(roleId: string): Promise<number> {
        return this.userCount(roleId);
    }

    async countRolesHoldingPermission(permissionName: string, excludeRoleId?: string): Promise<number> {
        const rows = await db
            .select({ roleId: rolePermissionsTable.roleId })
            .from(rolePermissionsTable)
            .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionsTable.permissionId))
            .where(eq(permissionsTable.name, permissionName));

        const roleIds = new Set(rows.map((r) => r.roleId));

        if (excludeRoleId) roleIds.delete(excludeRoleId);

        return roleIds.size;
    }
}
