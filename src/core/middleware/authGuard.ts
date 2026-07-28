import { RequestHandler } from "express";
import { verifyAccessToken } from "@core/utils/jwt";
import { UnauthorizedError } from "@core/errors/AppError";

export const authGuard: RequestHandler = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return next(new UnauthorizedError("Missing bearer token"));

    try {
        const payload = verifyAccessToken(header.slice(7));
        req.auth = { userId: payload.sub, roleId: payload.roleId };
        next();
    } catch {
        next(new UnauthorizedError("Invalid or expired token"));
    }
};
