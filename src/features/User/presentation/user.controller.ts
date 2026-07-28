import { Request, Response } from "express";
import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { userService } from "../application/user.service";
import { UnauthorizedError } from "@core/errors/AppError";

export const userController = {
    list: asyncHandler(async (req, res) => {
        const { page, limit, search, roleId, isActive } = req.query as any;
        const result = await userService.list({ page, limit, search }, { roleId, isActive });
        sendSuccess(res, result.data, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages });
    }),
    get: asyncHandler(async (req, res) => sendSuccess(res, await userService.get(req.params.id as string))),
    create: asyncHandler(async (req, res) => sendSuccess(res, await userService.create(req.body), undefined, 201)),
    update: asyncHandler(async (req: Request, res: Response) => {
        if (!req.auth) throw new UnauthorizedError();
        sendSuccess(res, await userService.update(req.auth.userId, req.params.id as string, req.body));
    }),
    toggleStatus: asyncHandler(async (req, res) => sendSuccess(res, await userService.toggleStatus(req.params.id as string, req.body.isActive))),
    remove: asyncHandler(async (req: Request, res: Response) => {
        if (!req.auth) throw new UnauthorizedError();
        await userService.remove(req.auth.userId, req.params.id as string);
        res.status(204).send();
    }),
};
