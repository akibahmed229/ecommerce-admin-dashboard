import { Role } from "@features/Role/domain/role.entity";

export type UserGender = "male" | "female" | "other";

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    phone: string | null;
    gender: UserGender | null;
    avatar: string | null;
    roleId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserWithRole extends User {
    role: Role;
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    phone?: string;
    gender?: UserGender;
    avatar?: string;
    roleId: string;
    isActive?: boolean;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    gender?: UserGender;
    avatar?: string;
    roleId?: string;
    isActive?: boolean;
}

export interface UserFilterOptions {
    roleId?: string;
    isActive?: boolean;
}
