import { z } from "zod";

export const createPermissionGroupSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        actions: z.array(z.object({ name: z.string().min(1).max(50), description: z.string().max(255).optional() })).default([]),
    }),
});
export const updatePermissionGroupSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ name: z.string().min(1).max(100).optional(), description: z.string().max(500).optional() }),
});
export const addPermissionSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ name: z.string().min(1).max(50), description: z.string().max(255).optional() }),
});
export const listPermissionGroupsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().optional(),
    }),
});
