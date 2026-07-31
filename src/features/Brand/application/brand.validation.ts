import { z } from "zod";

const slug = z.string().min(1).max(255).regex(/^[a-z0-9-]+$/);

export const createBrandSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255),
        slug,
        description: z.string().max(2000).optional(),
        logoId: z.string().uuid().optional(),
        status: z.enum(["active", "inactive"]).optional(),
    }),
});
export const updateBrandSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        slug: slug.optional(),
        description: z.string().max(2000).optional(),
        logoId: z.string().uuid().optional(),
        status: z.enum(["active", "inactive"]).optional(),
    }),
});
export const listBrandsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
    }),
});
