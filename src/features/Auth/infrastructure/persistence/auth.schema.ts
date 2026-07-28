import { usersTable } from "@core/database/schema";
import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
} from "drizzle-orm/pg-core";

export const refreshTokensTable = pgTable("refresh_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    replacedByToken: text("replaced_by_token"), // For token rotation & reuse breach detection
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
