import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "@core/config/env";
import { JwtPayload } from "@features/Auth/domain/auth.entity";

export function signAccessToken(payload: Pick<JwtPayload, "sub" | "roleId">) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

// Refresh tokens are opaque random strings, not JWTs — hashed before storage/lookup
// so a DB dump doesn't leak usable tokens.
export function generateRefreshToken() {
    return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
