import { Router } from "express";
import { roleController } from "./role.controller";
import { validate } from "@core/middleware/validate";
import { permissionGuard } from "@core/middleware/permissionGuard";
import { createRoleSchema, updateRoleSchema, listRolesSchema } from "../application/role.validation";

export const roleRouter = Router();

roleRouter.get("/", permissionGuard("role:read"), validate(listRolesSchema), roleController.list);
roleRouter.post("/", permissionGuard("role:create"), validate(createRoleSchema), roleController.create);
roleRouter.get("/:id", permissionGuard("role:read"), roleController.get);
roleRouter.patch("/:id", permissionGuard("role:update"), validate(updateRoleSchema), roleController.update);
roleRouter.delete("/:id", permissionGuard("role:delete"), roleController.remove);
