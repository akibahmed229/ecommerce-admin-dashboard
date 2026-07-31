import { z } from "zod";

const slug = z.string().min(1).max(255).regex(/^[a-z0-9-]+$/);
const type = z.enum(["dropdown", "radio", "checkbox", "colour_swatch", "image_swatch"]);

export const createAttributeSchema = z.object({ body: z.object({ name: z.string().min(1).max(255), slug, type }) });
export const updateAttributeSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ name: z.string().min(1).max(255).optional(), slug: slug.optional(), type: type.optional() }),
});

const valueBody = z.object({
    value: z.string().min(1).max(255),
    slug,
    hexCode: z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be a hex colour like #FF0000").optional(),
    mediaId: z.string().uuid().optional(),
});
export const addValueSchema = z.object({ params: z.object({ id: z.string().uuid() }), body: valueBody });
export const updateValueSchema = z.object({
    params: z.object({ id: z.string().uuid(), valueId: z.string().uuid() }),
    body: valueBody.partial(),
});
