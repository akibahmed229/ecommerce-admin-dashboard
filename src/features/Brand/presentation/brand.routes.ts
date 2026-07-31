import { Router } from "express";
import { brandController } from "./brand.controller";
import { validate } from "@core/middleware/validate";
import { permissionGuard } from "@core/middleware/permissionGuard";
import { createBrandSchema, updateBrandSchema, listBrandsSchema } from "../application/brand.validation";

export const brandRouter = Router();

brandRouter.get("/", permissionGuard("brand:read"), validate(listBrandsSchema), brandController.list);
brandRouter.post("/", permissionGuard("brand:create"), validate(createBrandSchema), brandController.create);
brandRouter.get("/:id", permissionGuard("brand:read"), brandController.get);
brandRouter.patch("/:id", permissionGuard("brand:update"), validate(updateBrandSchema), brandController.update);
brandRouter.delete("/:id", permissionGuard("brand:delete"), brandController.remove);
