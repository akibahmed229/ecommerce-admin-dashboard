import { z } from "zod";

export const updateMetadataSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ altText: z.string().max(255).optional(), title: z.string().max(255).optional() }),
});

export const listMediaSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().optional(),
        type: z.enum(["image", "video", "document", "other"]).optional(),
    }),
});
