import { Request, Response } from "express";
import { asyncHandler } from "@core/utils/asyncHandler";
import { sendSuccess } from "@core/utils/response";
import { authService } from "../application/auth.service";
import { UnauthorizedError } from "@core/errors/AppError";

export const authController = {
    login: asyncHandler(async (req, res) => {
        sendSuccess(res, await authService.login(req.body.email, req.body.password));
    }),
    refresh: asyncHandler(async (req, res) => {
        sendSuccess(res, await authService.refresh(req.body.refreshToken));
    }),
    logout: asyncHandler(async (req, res) => {
        await authService.logout(req.body.refreshToken);
        res.status(204).send();
    }),
    session: asyncHandler(async (req: Request, res: Response) => {
        if (!req.auth) throw new UnauthorizedError();
        sendSuccess(res, await authService.session(req.auth.userId));
    }),
};
