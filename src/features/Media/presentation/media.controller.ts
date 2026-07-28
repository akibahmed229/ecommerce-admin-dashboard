import { Request } from "express";
import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { mediaService } from "../application/media.service";
import { UnauthorizedError, ValidationError } from "@core/errors/AppError";

export const mediaController = {
    list: asyncHandler(async (req, res) => {
        const { page, limit, search, type } = req.query as any;
        const result = await mediaService.list({ page, limit, search }, { type });
        sendSuccess(res, result.data, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages });
    }),
    get: asyncHandler(async (req, res) => sendSuccess(res, await mediaService.get(req.params.id as string))),
    upload: asyncHandler(async (req: Request, res) => {
        if (!req.auth) throw new UnauthorizedError();
        const files = (req.files as Express.Multer.File[]) ?? [];
        if (!files.length) throw new ValidationError("No files provided — use field name 'files'");
        sendSuccess(res, await mediaService.upload(files, req.auth.userId), undefined, 201);
    }),
    updateMetadata: asyncHandler(async (req, res) => sendSuccess(res, await mediaService.updateMetadata(req.params.id as string, req.body))),
    remove: asyncHandler(async (req, res) => { await mediaService.remove(req.params.id as string); res.status(204).send(); }),
};
