import "dotenv/config";
import { z } from "zod";

const schema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    MEDIA_MAX_IMAGE_MB: z.coerce.number().default(10),
    MEDIA_MAX_VIDEO_MB: z.coerce.number().default(100),
});

export const env = schema.parse(process.env);
