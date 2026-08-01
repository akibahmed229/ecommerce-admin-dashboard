import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { categoryService } from "../application/category.service";

export const categoryController = {
    list: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.list())),
    tree: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.tree())),
    get: asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        sendSuccess(res, await categoryService.get(id));
    }),
    create: asyncHandler(async (req, res) => sendSuccess(res, await categoryService.create(req.body), undefined, 201)),
    update: asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        sendSuccess(res, await categoryService.update(id, req.body));
    }),
    remove: asyncHandler(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await categoryService.remove(id);
        res.status(204).send();
    }),
};
