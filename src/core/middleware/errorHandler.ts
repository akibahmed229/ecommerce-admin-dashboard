import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "@core/errors/AppError";
import { logEvents } from "./logEvents";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof ZodError) {
        return res.status(422).json({
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.flatten() },
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
        });
    }

    if (err?.code === "23505") {
        return res.status(409).json({ success: false, error: { code: "CONFLICT", message: "A record with this value already exists" } });
    }
    if (err?.code === "23503") {
        return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Referenced record does not exist" } });
    }

    console.error(err);
    logEvents(`${err.name}: ${err.message}`, "errLogs.txt");
    return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
};
