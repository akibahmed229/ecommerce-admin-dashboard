import { AuthRepository } from "../infrastructure/persistence/auth.repository.impl";
import { UserRepository } from "@features/User/infrastructure/persistence/user.repository.impl";
import { RoleRepository } from "@features/Role/infrastructure/persistence/role.repository.impl";
import { verifyPassword } from "@core/utils/hash";
import { signAccessToken, generateRefreshToken } from "@core/utils/jwt";
import { UnauthorizedError } from "@core/errors/AppError";
import { env } from "@core/config/env";
import { SessionUser, TokenPair } from "../domain/auth.entity";

const authRepo = new AuthRepository();
const userRepo = new UserRepository();
const roleRepo = new RoleRepository();

const GENERIC_LOGIN_ERROR = "Invalid email or password"; // same message for bad email vs bad password — don't leak which

function refreshExpiry() {
    const d = new Date();
    d.setDate(d.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
    return d;
}

async function issueTokenPair(userId: string, roleId: string): Promise<TokenPair> {
    const accessToken = signAccessToken({ sub: userId, roleId });
    const refreshToken = generateRefreshToken();

    await authRepo.createRefreshToken(userId, refreshToken, refreshExpiry());

    return { accessToken, refreshToken };
}

export const authService = {
    async login(email: string, password: string): Promise<TokenPair> {
        const user = await userRepo.findByEmail(email.toLowerCase().trim());
        if (!user?.password || !user.isActive) throw new UnauthorizedError(GENERIC_LOGIN_ERROR);

        const valid = await verifyPassword(password, user.password);
        if (!valid) throw new UnauthorizedError(GENERIC_LOGIN_ERROR);

        return issueTokenPair(user.id, user.roleId);
    },

    async refresh(oldToken: string): Promise<TokenPair> {
        const record = await authRepo.findRefreshToken(oldToken);
        if (!record) throw new UnauthorizedError("Invalid refresh token");

        if (record.isRevoked) {
            // Someone presented a token that was already rotated out — classic theft signal.
            // Kill every session for this user, not just this one token.
            await authRepo.revokeAllUserTokens(record.userId);
            throw new UnauthorizedError("Refresh token reuse detected — all sessions revoked");
        }
        if (record.expiresAt < new Date()) throw new UnauthorizedError("Refresh token expired");

        const user = await userRepo.findById(record.userId);
        if (!user || !user.isActive) throw new UnauthorizedError("Account is inactive");

        const pair = await issueTokenPair(user.id, user.roleId);
        await authRepo.revokeToken(oldToken, pair.refreshToken); // rotation: old one dies right here
        return pair;
    },

    async logout(token: string): Promise<void> {
        const record = await authRepo.findRefreshToken(token);
        if (record && !record.isRevoked) await authRepo.revokeToken(token);
        // No error if already gone/unknown — logout is idempotent, don't leak token validity either.
    },

    async session(userId: string): Promise<SessionUser> {
        const user = await userRepo.findById(userId);
        if (!user) throw new UnauthorizedError();
        const role = await roleRepo.findById(user.roleId);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            roleName: role?.name ?? "",
            permissions: role?.permissions.map((p) => p.name) ?? [],
        };
    },
};
