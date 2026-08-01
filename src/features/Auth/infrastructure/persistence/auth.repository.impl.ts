import { eq } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { IAuthRepository } from "@features/Auth/domain/auth.repository";
import { RefreshToken } from "@features/Auth/domain/auth.entity";
import { hashToken } from "@core/utils/jwt";
import { refreshTokensTable } from "./auth.schema";

export class AuthRepository implements IAuthRepository {
    async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
        const [row] = await db
            .insert(refreshTokensTable)
            .values({ userId, token: hashToken(token), expiresAt })
            .returning();

        return row;
    }

    async findRefreshToken(token: string): Promise<RefreshToken | null> {
        const [row] = await db.select()
            .from(refreshTokensTable)
            .where(eq(refreshTokensTable.token, hashToken(token)));

        return row ?? null;
    }

    async revokeToken(token: string, replacedByToken?: string): Promise<void> {
        await db
            .update(refreshTokensTable)
            .set({ isRevoked: true, replacedByToken: replacedByToken ? hashToken(replacedByToken) : null })
            .where(eq(refreshTokensTable.token, hashToken(token)));
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await db
            .update(refreshTokensTable)
            .set({ isRevoked: true })
            .where(eq(refreshTokensTable.userId, userId));
    }
}
