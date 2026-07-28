import { eq, ilike, and, count } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { IUserRepository } from "@features/User/domain/user.repository";
import { User, UserWithRole, CreateUserInput, UpdateUserInput, UserFilterOptions } from "@features/User/domain/user.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";
import { hashPassword } from "@core/utils/hash";
import { usersTable } from "./user.schema";
import { rolesTable } from "@core/database/schema";

export class UserRepository implements IUserRepository {
    async findById(id: string): Promise<UserWithRole | null> {
        const [row] = await db.select({ user: usersTable, role: rolesTable }).from(usersTable).innerJoin(rolesTable, eq(rolesTable.id, usersTable.roleId)).where(eq(usersTable.id, id));
        return row ? { ...row.user, role: row.role } : null;
    }

    async findByEmail(email: string): Promise<UserWithRole | null> {
        // Deliberately includes the password hash — this method exists for Auth.
        // usersTableervice.stripPassword() (below) is the only thing allowed to hand a User back to a controller.
        const [row] = await db.select({ user: usersTable, role: rolesTable }).from(usersTable).innerJoin(rolesTable, eq(rolesTable.id, usersTable.roleId)).where(eq(usersTable.email, email));
        return row ? { ...row.user, role: row.role } : null;
    }

    async findAll(options: PaginationOptions, filters?: UserFilterOptions): Promise<PaginatedResult<UserWithRole>> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (options.search) conditions.push(ilike(usersTable.name, `%${options.search}%`));
        if (filters?.roleId) conditions.push(eq(usersTable.roleId, filters.roleId));
        if (filters?.isActive !== undefined) conditions.push(eq(usersTable.isActive, filters.isActive));
        const whereClause = conditions.length ? and(...conditions) : undefined;

        const rows = await db.select({ user: usersTable, role: rolesTable }).from(usersTable).innerJoin(rolesTable, eq(rolesTable.id, usersTable.roleId)).where(whereClause).limit(limit).offset(offset);
        const [{ value: total }] = await db.select({ value: count() }).from(usersTable).where(whereClause);

        return {
            data: rows.map((r) => ({ ...r.user, role: r.role })),
            total, page, limit, totalPages: Math.ceil(total / limit),
        };
    }

    async create(input: CreateUserInput): Promise<UserWithRole> {
        const passwordHash = await hashPassword(input.password);
        const [row] = await db.insert(usersTable).values({
            name: input.name,
            email: input.email.toLowerCase().trim(),
            password: passwordHash,
            phone: input.phone,
            gender: input.gender,
            avatar: input.avatar,
            roleId: input.roleId,
            isActive: input.isActive ?? true,
        }).returning();
        return (await this.findById(row.id))!;
    }

    async update(id: string, input: UpdateUserInput): Promise<UserWithRole> {
        const values: Record<string, unknown> = { updatedAt: new Date() };
        for (const key of ["name", "phone", "gender", "avatar", "roleId", "isActive"] as const) {
            if (input[key] !== undefined) values[key] = input[key];
        }
        if (input.email !== undefined) values.email = input.email.toLowerCase().trim();
        if (input.password) values.password = await hashPassword(input.password);

        await db.update(usersTable).set(values).where(eq(usersTable.id, id));
        return (await this.findById(id))!;
    }

    async toggleStatus(id: string, isActive: boolean): Promise<User> {
        const [row] = await db.update(usersTable).set({ isActive, updatedAt: new Date() }).where(eq(usersTable.id, id)).returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const result = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
        return result.length > 0;
    }
}
