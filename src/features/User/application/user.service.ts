import { UserRepository } from "../infrastructure/persistence/user.repository.impl";
import { CreateUserInput, UpdateUserInput, UserFilterOptions } from "../domain/user.entity";
import { PaginationOptions } from "@core/types/pagination";
import { ConflictError, ForbiddenError, NotFoundError } from "@core/errors/AppError";

const repo = new UserRepository();

function stripPassword<T extends { password?: string }>(user: T) {
    const { password, ...rest } = user;
    return rest;
}

export const userService = {
    async list(options: PaginationOptions, filters: UserFilterOptions) {
        const result = await repo.findAll(options, filters);
        return { ...result, data: result.data.map(stripPassword) };
    },

    async get(id: string) {
        const user = await repo.findById(id);
        if (!user) throw new NotFoundError("User not found");
        return stripPassword(user);
    },

    async create(input: CreateUserInput) {
        if (await repo.findByEmail(input.email.toLowerCase().trim())) throw new ConflictError("A user with this email already exists");
        return stripPassword(await repo.create(input));
    },

    async update(requesterId: string, targetId: string, input: UpdateUserInput) {
        // Self-escalation guard — a user can never change their own role.
        if (requesterId === targetId && input.roleId) throw new ForbiddenError("You cannot change your own role");

        const existing = await repo.findById(targetId);
        if (!existing) throw new NotFoundError("User not found");
        if (input.email && input.email.toLowerCase() !== existing.email) {
            if (await repo.findByEmail(input.email.toLowerCase().trim())) throw new ConflictError("A user with this email already exists");
        }
        return stripPassword(await repo.update(targetId, input));
    },

    async toggleStatus(id: string, isActive: boolean) {
        if (!(await repo.findById(id))) throw new NotFoundError("User not found");
        return stripPassword(await repo.toggleStatus(id, isActive));
    },

    async remove(requesterId: string, targetId: string) {
        if (requesterId === targetId) throw new ForbiddenError("You cannot delete your own account");
        if (!(await repo.delete(targetId))) throw new NotFoundError("User not found");
        return true;
    },
};
