import { z } from "zod";

const slug = z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens only");

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255),
        slug,
        description: z.string().max(2000).optional(),
        imageId: z.string().uuid().optional(),
        parentId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        slug: slug.optional(),
        description: z.string().max(2000).optional(),
        imageId: z.string().uuid().optional(),
        parentId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
    }),
});
