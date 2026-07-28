export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    isRevoked: boolean;
    replacedByToken: string | null;
    expiresAt: Date;
    createdAt: Date;
}

export interface SessionUser {
    id: string;
    name: string;
    email: string;
    roleId: string;
    roleName: string;
    permissions: string[]; // Flat list of permission strings (e.g. ['product:create'])
}

export interface JwtPayload {
    sub: string; // userId
    roleId: string;
    iat?: number;
    exp?: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}
