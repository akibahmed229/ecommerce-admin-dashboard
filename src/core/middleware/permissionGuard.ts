import { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { rolePermissionsTable } from "@features/Role/infrastructure/persistence/role.schema";
import { permissionsTable } from "@features/Permission/infrastructure/persistence/permission.schema";
import { ForbiddenError, UnauthorizedError } from "@core/errors/AppError";

export const permissionGuard =
    (required: string): RequestHandler =>
        async (req, res, next) => {
            try {
                if (!req.auth) return next(new UnauthorizedError());

                // Queried fresh on every request by roleId (not cached in the JWT) — a permission
                // *revoked from a role* takes effect on the very next request. Reassigning a user
                // to a *different* role only takes effect at their next token refresh, since roleId
                // itself is baked into the access token. Document both in your README.
                const rows = await db
                    .select({ name: permissionsTable.name })
                    .from(rolePermissionsTable)
                    .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionsTable.permissionId))
                    .where(eq(rolePermissionsTable.roleId, req.auth.roleId));

                const names = rows.map((r) => r.name);
                req.permissions = names;

                if (!names.includes(required)) return next(new ForbiddenError(`Missing permission: ${required}`));
                next();
            } catch (err) {
                next(err);
            }
        };
