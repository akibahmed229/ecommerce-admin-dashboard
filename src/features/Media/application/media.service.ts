import { Readable } from "stream";
import { fileTypeFromBuffer } from "file-type"; // ESM-only — dynamic import below if your build is CJS
import { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { cloudinary } from "@core/config/cloudinary";
import { env } from "@core/config/env";
import { MediaRepository } from "../infrastructure/persistence/media.repository.impl";
import { CreateMediaInput, Media, MediaType, UpdateMediaMetadataInput, MediaFilterOptions } from "../domain/media.entity";
import { PaginationOptions } from "@core/types/pagination";
import { ConflictError, NotFoundError, ValidationError } from "@core/errors/AppError";
import { ALLOWED_IMAGE_TYPES, ALLOWED_MIME_TYPES } from "../domain/media.constants";

const repo = new MediaRepository();

interface IncomingFile {
    buffer: Buffer;
    originalname: string;
}

async function detectRealType(file: IncomingFile) {
    // Never trust file.mimetype (client-supplied) or the extension — read the actual bytes.
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
        throw new ValidationError(`"${file.originalname}" is not an allowed file type`);
    }
    const isImage = ALLOWED_IMAGE_TYPES.includes(detected.mime);
    const maxBytes = (isImage ? env.MEDIA_MAX_IMAGE_MB : env.MEDIA_MAX_VIDEO_MB) * 1024 * 1024;
    if (file.buffer.length > maxBytes) {
        throw new ValidationError(`"${file.originalname}" exceeds the ${isImage ? env.MEDIA_MAX_IMAGE_MB : env.MEDIA_MAX_VIDEO_MB}MB limit`);
    }
    return { mime: detected.mime, ext: detected.ext, resourceType: isImage ? ("image" as const) : ("video" as const) };
}

function uploadToCloudinary(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
            resolve(result);
        });
        Readable.from(buffer).pipe(stream);
    });
}

async function uploadOne(file: IncomingFile, uploadedBy: string): Promise<CreateMediaInput> {
    const { mime, resourceType } = await detectRealType(file);

    const result = await uploadToCloudinary(file.buffer, { resource_type: resourceType, folder: "admin-dashboard" });

    const thumbnailUrl =
        resourceType === "image"
            ? cloudinary.url(result.public_id, { secure: true, transformation: [{ width: 300, height: 300, crop: "thumb", gravity: "auto" }] })
            : null;

    return {
        fileName: file.originalname,
        storedPath: result.public_id, // Cloudinary public_id — needed to delete or re-transform later
        publicUrl: result.secure_url,
        mimeType: mime,
        type: (resourceType as MediaType),
        size: result.bytes,
        width: result.width ?? undefined,
        height: result.height ?? undefined,
        thumbnailUrl: thumbnailUrl ?? undefined,
        uploadedBy,
    };
}

export const mediaService = {
    list: (options: PaginationOptions, filters: MediaFilterOptions) => repo.findAll(options, filters),

    async get(id: string): Promise<Media> {
        const item = await repo.findById(id);
        if (!item) throw new NotFoundError("Media not found");
        return item;
    },

    async upload(files: IncomingFile[], uploadedBy: string): Promise<Media[]> {
        if (!files.length) throw new ValidationError("No files provided");
        // Validate every file up front — all-or-nothing, so you never end up with 3 of 5
        // uploaded and a confusing partial success.
        const inputs = await Promise.all(files.map((f) => uploadOne(f, uploadedBy)));
        return repo.createBatch(inputs);
    },

    async updateMetadata(id: string, input: UpdateMediaMetadataInput): Promise<Media> {
        if (!(await repo.findById(id))) throw new NotFoundError("Media not found");
        return repo.updateMetadata(id, input);
    },

    async remove(id: string): Promise<boolean> {
        const item = await repo.findById(id);
        if (!item) throw new NotFoundError("Media not found");

        const usage = await repo.checkUsage(id);
        if (usage.isAttached) {
            throw new ConflictError(`Cannot delete — still attached to a ${usage.attachedToModule}. Detach it first.`);
        }

        await cloudinary.uploader.destroy(item.storedPath, { resource_type: item.type === "video" ? "video" : "image" });
        return repo.delete(id);
    },
};
