import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { attributeService } from "../application/attribute.service";

export const attributeController = {
    list: asyncHandler(async (req, res) => sendSuccess(res, await attributeService.list())),
    get: asyncHandler(async (req, res) => sendSuccess(res, await attributeService.get(req.params.id as string))),
    create: asyncHandler(async (req, res) => sendSuccess(res, await attributeService.create(req.body), undefined, 201)),
    update: asyncHandler(async (req, res) => sendSuccess(res, await attributeService.update(req.params.id as string, req.body))),
    remove: asyncHandler(async (req, res) => { await attributeService.remove(req.params.id as string); res.status(204).send(); }),
    addValue: asyncHandler(async (req, res) => sendSuccess(res, await attributeService.addValue(req.params.id as string, req.body), undefined, 201)),
    updateValue: asyncHandler(async (req, res) => sendSuccess(res, await attributeService.updateValue(req.params.id as string, req.params.valueId as string, req.body))),
    removeValue: asyncHandler(async (req, res) => { await attributeService.removeValue(req.params.id as string, req.params.valueId as string); res.status(204).send(); }),
};
