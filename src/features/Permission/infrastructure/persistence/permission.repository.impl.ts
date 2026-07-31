import { eq, ilike, count } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { IPermissionRepository } from "@features/Permission/domain/permission.repository";
import { PermissionGroup, Permission, PermissionGroupWithActions, CreatePermissionGroupInput, UpdatePermissionGroupInput } from "@features/Permission/domain/permission.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";
import { normalizeAction, slugifyGroupName } from "../../application/permission.utils";
import { permissionGroupsTable, permissionsTable } from "./permission.schema";

export class PermissionRepository implements IPermissionRepository {
    async findGroupById(id: string): Promise<PermissionGroupWithActions | null> {
        const [group] = await db
            .select().from(permissionGroupsTable)
            .where(eq(permissionGroupsTable.id, id));

        if (!group) return null;

        const actions = await db
            .select().from(permissionsTable)
            .where(eq(permissionsTable.groupId, id));

        return { ...group, actions };
    }

    async findGroupByName(name: string): Promise<PermissionGroup | null> {
        const [group] = await db.select()
            .from(permissionGroupsTable)
            .where(eq(permissionGroupsTable.name, name));

        return group ?? null;
    }

    async findAllGroups(options: PaginationOptions): Promise<PaginatedResult<PermissionGroupWithActions>> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const offset = (page - 1) * limit;
        const whereClause = options.search ? ilike(permissionGroupsTable.name, `%${options.search}%`) : undefined;

        const groups = await db
            .select().
            from(permissionGroupsTable).
            where(whereClause)
            .limit(limit)
            .offset(offset);

        const [{ value: total }] = await db
            .select({ value: count() })
            .from(permissionGroupsTable).where(whereClause);

        const data: PermissionGroupWithActions[] = [];

        for (const group of groups) {
            const actions = await db
                .select().from(permissionsTable)
                .where(eq(permissionsTable.groupId, group.id));

            data.push({ ...group, actions });
        }

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createGroupWithPermissions(input: CreatePermissionGroupInput): Promise<PermissionGroupWithActions> {
        return db.transaction(async (tx: any) => {
            const [group] = await tx.insert(permissionGroupsTable)
                .values(
                    {
                        name: input.name,
                        description: input.description
                    }
                )
                .returning();
            const prefix = slugifyGroupName(group.name);
            const rows = input.actions.length
                ? await tx.insert(permissionsTable).values(
                    input.actions.map((a) => (
                        {
                            groupId: group.id,
                            name: `${prefix}:${normalizeAction(a.name)}`,
                            description: a.description
                        }
                    ))
                ).returning()
                : [];

            return { ...group, actions: rows };
        });
    }

    async updateGroup(id: string, input: UpdatePermissionGroupInput): Promise<PermissionGroup> {
        const [group] = await db.
            update(permissionGroupsTable).
            set(
                {
                    name: input.name,
                    description: input.description,
                    updatedAt: new Date()
                })
            .where(eq(permissionGroupsTable.id, id)).returning();

        return group;
    }

    async findPermissionByName(name: string): Promise<Permission | null> {
        const [permission] = await db.select().from(permissionsTable).where(eq(permissionsTable.name, name));
        return permission ?? null;
    }

    async addPermissionToGroup(groupId: string, name: string, description?: string): Promise<Permission> {
        const [group] = await db
            .select()
            .from(permissionGroupsTable)
            .where(eq(permissionGroupsTable.id, groupId));

        const prefix = slugifyGroupName(group.name);

        const [permission] = await db
            .insert(permissionsTable).
            values(
                {
                    groupId,
                    name: `${prefix}:${normalizeAction(name)}`,
                    description
                }
            )
            .returning();

        return permission;
    }

    async deletePermission(id: string): Promise<boolean> {
        const result = await db
            .delete(permissionsTable)
            .where(eq(permissionsTable.id, id))
            .returning({ id: permissionsTable.id });

        return result.length > 0;
    }

    async deleteGroup(id: string): Promise<boolean> {
        const result = await db
            .delete(permissionGroupsTable)
            .where(eq(permissionGroupsTable.id, id))
            .returning({ id: permissionGroupsTable.id });

        return result.length > 0; // cascades permissionsTable -> role_permissionsTable per your schema's onDelete: "cascade"
    }
}
