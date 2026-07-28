import multer from "multer";
import { env } from "@core/config/env";

// Memory storage on purpose — we need the buffer in hand to check real magic bytes
// before deciding whether to trust the file at all. Disk storage would mean writing
// first and validating after, which is the exact mistake the doc calls out.
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MEDIA_MAX_VIDEO_MB * 1024 * 1024 }, // upper bound only; per-type limit enforced in the service
});
