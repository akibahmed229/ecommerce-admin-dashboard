import { z } from "zod";

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        status: z.enum(["active", "inactive"]).optional(),
        permissionIds: z.array(z.string().uuid()).default([]),
        grantAll: z.boolean().optional(), // shortcut for building an administrator role
    }),
});
export const updateRoleSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        status: z.enum(["active", "inactive"]).optional(),
        permissionIds: z.array(z.string().uuid()).optional(),
        grantAll: z.boolean().optional(),
    }),
});
export const listRolesSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().optional(),
    }),
});
