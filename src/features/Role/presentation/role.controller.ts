import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { roleService } from "../application/role.service";

export const roleController = {
    list: asyncHandler(async (req, res) => {
        const { page, limit, search } = req.query as any;
        const result = await roleService.list({ page, limit, search });
        sendSuccess(res, result.data, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages });
    }),
    get: asyncHandler(async (req, res) => sendSuccess(res, await roleService.get(req.params.id as string))),
    create: asyncHandler(async (req, res) => sendSuccess(res, await roleService.create(req.body), undefined, 201)),
    update: asyncHandler(async (req, res) => sendSuccess(res, await roleService.update(req.params.id as string, req.body))),
    remove: asyncHandler(async (req, res) => { await roleService.remove(req.params.id as string); res.status(204).send(); }),
};
