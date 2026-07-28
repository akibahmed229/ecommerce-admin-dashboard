import { RefreshToken } from "./auth.entity";

export interface IAuthRepository {
    createRefreshToken(
        userId: string,
        token: string,
        expiresAt: Date
    ): Promise<RefreshToken>;

    findRefreshToken(token: string): Promise<RefreshToken | null>;

    revokeToken(token: string, replacedByToken?: string): Promise<void>;

    revokeAllUserTokens(userId: string): Promise<void>;
}
