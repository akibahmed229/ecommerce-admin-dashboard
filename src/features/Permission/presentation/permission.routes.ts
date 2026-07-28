import { Router } from "express";
import { permissionController } from "./permission.controller";
import { validate } from "@core/middleware/validate";
import { permissionGuard } from "@core/middleware/permissionGuard";
import { createPermissionGroupSchema, updatePermissionGroupSchema, addPermissionSchema, listPermissionGroupsSchema } from "../application/permission.validation";

export const permissionRouter = Router();

permissionRouter.get("/groups", permissionGuard("permission:read"), validate(listPermissionGroupsSchema), permissionController.list);
permissionRouter.post("/groups", permissionGuard("permission:create"), validate(createPermissionGroupSchema), permissionController.create);
permissionRouter.get("/groups/:id", permissionGuard("permission:read"), permissionController.get);
permissionRouter.patch("/groups/:id", permissionGuard("permission:update"), validate(updatePermissionGroupSchema), permissionController.update);
permissionRouter.delete("/groups/:id", permissionGuard("permission:delete"), permissionController.removeGroup);
permissionRouter.post("/groups/:id/actions", permissionGuard("permission:create"), validate(addPermissionSchema), permissionController.addAction);
permissionRouter.delete("/:permissionId", permissionGuard("permission:delete"), permissionController.removePermission);
