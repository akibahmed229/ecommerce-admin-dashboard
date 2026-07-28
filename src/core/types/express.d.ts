import "express";

declare global {
    namespace Express {
        interface Request {
            auth?: { userId: string; roleId: string };
            permissions?: string[];
        }
    }
}

export { };
