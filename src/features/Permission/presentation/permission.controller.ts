import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { permissionService } from "../application/permission.service";

export const permissionController = {
    list: asyncHandler(async (req, res) => {
        const { page, limit, search } = req.query as any;
        const result = await permissionService.list({ page, limit, search });
        sendSuccess(res, result.data, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages });
    }),
    get: asyncHandler(async (req, res) => sendSuccess(res, await permissionService.getGroup(req.params.id as string))),
    create: asyncHandler(async (req, res) => sendSuccess(res, await permissionService.createGroup(req.body), undefined, 201)),
    update: asyncHandler(async (req, res) => sendSuccess(res, await permissionService.updateGroup(req.params.id as string, req.body))),
    addAction: asyncHandler(async (req, res) => sendSuccess(res, await permissionService.addAction(req.params.id as string, req.body.name, req.body.description), undefined, 201)),
    removePermission: asyncHandler(async (req, res) => { await permissionService.deletePermission(req.params.permissionId as string); res.status(204).send(); }),
    removeGroup: asyncHandler(async (req, res) => { await permissionService.deleteGroup(req.params.id as string); res.status(204).send(); }),
};
