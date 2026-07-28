import { Router } from "express";
import { authRouter } from "@features/Auth/presentation/auth.routes";
import { permissionRouter } from "@features/Permission/presentation/permission.routes";
import { roleRouter } from "@features/Role/presentation/role.routes";
import { userRouter } from "@features/User/presentation/user.routes";
import { authGuard } from "@core/middleware/authGuard";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter); // public

apiRouter.use(authGuard); // everything below this line requires a valid access token — one line, can't forget it
apiRouter.use("/permissions", permissionRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/users", userRouter);
