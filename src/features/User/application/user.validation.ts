import { z } from "zod";

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255),
        email: z.string().email(),
        password: z.string().min(8),
        phone: z.string().max(50).optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        avatar: z.string().url().optional(),
        roleId: z.string().uuid(), // required, never defaulted
        isActive: z.boolean().optional(),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
        phone: z.string().max(50).optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        avatar: z.string().url().optional(),
        roleId: z.string().uuid().optional(),
    }),
});

export const toggleStatusSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ isActive: z.boolean() }),
});

export const listUsersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().optional(),
        roleId: z.string().uuid().optional(),
        isActive: z.coerce.boolean().optional(),
    }),
});
