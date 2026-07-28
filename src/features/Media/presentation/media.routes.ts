import { Router } from "express";
import { mediaController } from "./media.controller";
import { validate } from "@core/middleware/validate";
import { permissionGuard } from "@core/middleware/permissionGuard";
import { upload } from "@core/middleware/upload";
import { updateMetadataSchema, listMediaSchema } from "../application/media.validation";

export const mediaRouter = Router();

mediaRouter.get("/", permissionGuard("media:read"), validate(listMediaSchema), mediaController.list);
mediaRouter.get("/:id", permissionGuard("media:read"), mediaController.get);
mediaRouter.post("/", permissionGuard("media:upload"), upload.array("files", 10), mediaController.upload);
mediaRouter.patch("/:id", permissionGuard("media:write"), validate(updateMetadataSchema), mediaController.updateMetadata);
mediaRouter.delete("/:id", permissionGuard("media:delete"), mediaController.remove);
