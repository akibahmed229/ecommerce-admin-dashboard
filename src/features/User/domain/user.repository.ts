import {
    User,
    UserWithRole,
    CreateUserInput,
    UpdateUserInput,
    UserFilterOptions,
} from "./user.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";

export interface IUserRepository {
    findById(id: string): Promise<UserWithRole | null>;

    findByEmail(email: string): Promise<UserWithRole | null>;

    findAll(
        options: PaginationOptions,
        filters?: UserFilterOptions
    ): Promise<PaginatedResult<UserWithRole>>;

    create(input: CreateUserInput): Promise<UserWithRole>;

    update(id: string, input: UpdateUserInput): Promise<UserWithRole>;

    toggleStatus(id: string, isActive: boolean): Promise<User>;

    delete(id: string): Promise<boolean>;
}
