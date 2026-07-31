import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { categoryService } from "../application/category.service";

export const categoryController = {
    list: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.list())),
    tree: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.tree())),
    get: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.get(req.params.id))),
    create: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.create(req.body), undefined, 201)),
    update: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.update(req.params.id, req.body))),
    remove: asyncHandler(async (req, res) => { await categoryService.remove(req.params.id); res.status(204).send(); }),
};
