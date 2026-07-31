import { Router } from "express";
import { categoryController } from "./category.controller";
import { validate } from "@core/middleware/validate";
import { permissionGuard } from "@core/middleware/permissionGuard";
import { createCategorySchema, updateCategorySchema } from "../application/category.validation";

export const categoryRouter = Router();

categoryRouter.get("/", permissionGuard("category:read"), categoryController.list);
categoryRouter.get("/tree", permissionGuard("category:read"), categoryController.tree); // must come before "/:id" — see note below
categoryRouter.post("/", permissionGuard("category:create"), validate(createCategorySchema), categoryController.create);
categoryRouter.get("/:id", permissionGuard("category:read"), categoryController.get);
categoryRouter.patch("/:id", permissionGuard("category:update"), validate(updateCategorySchema), categoryController.update);
categoryRouter.delete("/:id", permissionGuard("category:delete"), categoryController.remove);
