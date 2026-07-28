import { Router } from "express";
import { authController } from "./auth.controller";
import { authGuard } from "@core/middleware/authGuard";
import { validate } from "@core/middleware/validate";
import { loginSchema, refreshSchema, logoutSchema } from "../application/auth.validation";

export const authRouter = Router();

// login/refresh/logout are ALL public, on purpose — logout works off the refresh token
// in the body, not a live access token, so you can still log out with an expired session.
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/logout", validate(logoutSchema), authController.logout);

authRouter.get("/session", authGuard, authController.session);
