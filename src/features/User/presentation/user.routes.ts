import { Router } from "express";
import { userController } from "./user.controller";
import { validate } from "@core/middleware/validate";
import { permissionGuard } from "@core/middleware/permissionGuard";
import { createUserSchema, updateUserSchema, toggleStatusSchema, listUsersSchema } from "../application/user.validation";

export const userRouter = Router();

userRouter.get("/", permissionGuard("user:read"), validate(listUsersSchema), userController.list);
userRouter.post("/", permissionGuard("user:create"), validate(createUserSchema), userController.create);
userRouter.get("/:id", permissionGuard("user:read"), userController.get);
userRouter.patch("/:id", permissionGuard("user:update"), validate(updateUserSchema), userController.update);
userRouter.patch("/:id/status", permissionGuard("user:update"), validate(toggleStatusSchema), userController.toggleStatus);
userRouter.delete("/:id", permissionGuard("user:delete"), userController.remove);
