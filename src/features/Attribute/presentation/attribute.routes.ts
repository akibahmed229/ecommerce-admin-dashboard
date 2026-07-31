import { Router } from "express";
import { attributeController } from "./attribute.controller";
import { validate } from "@core/middleware/validate";
import { permissionGuard } from "@core/middleware/permissionGuard";
import { createAttributeSchema, updateAttributeSchema, addValueSchema, updateValueSchema } from "../application/attribute.validation";

export const attributeRouter = Router();

attributeRouter.get("/", permissionGuard("attribute:read"), attributeController.list);
attributeRouter.post("/", permissionGuard("attribute:create"), validate(createAttributeSchema), attributeController.create);
attributeRouter.get("/:id", permissionGuard("attribute:read"), attributeController.get);
attributeRouter.patch("/:id", permissionGuard("attribute:update"), validate(updateAttributeSchema), attributeController.update);
attributeRouter.delete("/:id", permissionGuard("attribute:delete"), attributeController.remove);

// Nested value routes use attribute:update — same convention as Product's variant sub-resources tomorrow:
// modifying something under an existing parent, not creating a new top-level entity.
attributeRouter.post("/:id/values", permissionGuard("attribute:update"), validate(addValueSchema), attributeController.addValue);
attributeRouter.patch("/:id/values/:valueId", permissionGuard("attribute:update"), validate(updateValueSchema), attributeController.updateValue);
attributeRouter.delete("/:id/values/:valueId", permissionGuard("attribute:delete"), attributeController.removeValue);
