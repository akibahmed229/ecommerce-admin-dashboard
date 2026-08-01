import "dotenv/config";
import { db } from "./drizzle-client";
import { hashPassword } from "@core/utils/hash";
import { permissionGroupsTable, permissionsTable, rolePermissionsTable, rolesTable, usersTable } from "./schema";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const MODULES: Record<string, string[]> = {
    dashboard: ["watch"],
    permission: ["watch", "create", "read", "update", "delete"],
    role: ["watch", "create", "read", "update", "delete"],
    user: ["watch", "create", "read", "update", "delete"],
    media: ["watch", "read", "upload", "write", "delete"],
    category: ["watch", "create", "read", "update", "delete"],
    brand: ["watch", "create", "read", "update", "delete"],
    attribute: ["watch", "create", "read", "update", "delete"],
    product: ["watch", "create", "read", "update", "delete"],
};
const CATALOG_MODULES = ["category", "brand", "attribute", "product", "media", "dashboard"];

async function main() {
    console.log("Running migrations...");
    // Make sure the path points to your drizzle migrations folder
    await migrate(db, { migrationsFolder: "./drizzle" });

    console.log("Seeding database...");
    // ... your existing seed logic here


    const allIds: string[] = [];
    const catalogIds: string[] = [];

    for (const [moduleName, actions] of Object.entries(MODULES)) {
        const [group] = await db.insert(permissionGroupsTable).values({
            name: moduleName[0].toUpperCase() + moduleName.slice(1),
            description: `${moduleName} module`,
        }).returning();

        for (const action of actions) {
            const [permission] = await db.insert(permissionsTable).values({ groupId: group.id, name: `${moduleName}:${action}` }).returning();
            allIds.push(permission.id);
            if (CATALOG_MODULES.includes(moduleName)) catalogIds.push(permission.id);
        }
    }

    const [superAdmin] = await db.insert(rolesTable).values({ name: "Super Admin", description: "Full system access", status: "active" }).returning();
    await db.insert(rolePermissionsTable).values(allIds.map((permissionId) => ({ roleId: superAdmin.id, permissionId })));

    const [catalogRole] = await db.insert(rolesTable).values({ name: "Catalog Manager", description: "Catalog-only, for verifying 403s", status: "active" }).returning();
    await db.insert(rolePermissionsTable).values(catalogIds.map((permissionId) => ({ roleId: catalogRole.id, permissionId })));

    const superAdminPassword = "SuperAdmin!2026";
    const catalogPassword = "CatalogOnly!2026";

    await db.insert(usersTable).values({ name: "Super Admin", email: "admin@trendsbird.test", password: await hashPassword(superAdminPassword), roleId: superAdmin.id, isActive: true });
    await db.insert(usersTable).values({ name: "Catalog User", email: "catalog@trendsbird.test", password: await hashPassword(catalogPassword), roleId: catalogRole.id, isActive: true });

    console.log("Seeded. Credentials for your README:");
    console.log(`  Super admin — admin@trendsbird.test / ${superAdminPassword}`);
    console.log(`  Catalog user (expect 403 on permission/role/user routes) — catalog@trendsbird.test / ${catalogPassword}`);
    process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
