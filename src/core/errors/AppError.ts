export class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed", details?: unknown) {
        super(422, "VALIDATION_ERROR", message, details);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = "Unauthenticated") { super(401, "UNAUTHENTICATED", message); }
}
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") { super(403, "FORBIDDEN", message); }
}
export class NotFoundError extends AppError {
    constructor(message = "Not found") { super(404, "NOT_FOUND", message); }
}
export class ConflictError extends AppError {
    constructor(message = "Conflict") { super(409, "CONFLICT", message); }
}
