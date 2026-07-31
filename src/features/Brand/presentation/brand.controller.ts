import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { brandService } from "../application/brand.service";

export const brandController = {
    list: asyncHandler(async (req, res) => {
        const { page, limit, search, status } = req.query as any;
        const result = await brandService.list({ page, limit, search }, { status });
        sendSuccess(res, result.data, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages });
    }),
    get: asyncHandler(async (req, res) => sendSuccess(res, await brandService.get(req.params.id as string))),
    create: asyncHandler(async (req, res) => sendSuccess(res, await brandService.create(req.body), undefined, 201)),
    update: asyncHandler(async (req, res) => sendSuccess(res, await brandService.update(req.params.id as string, req.body))),
    remove: asyncHandler(async (req, res) => { await brandService.remove(req.params.id as string); res.status(204).send(); }),
};
