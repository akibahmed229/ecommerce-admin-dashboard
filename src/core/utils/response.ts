import { Response } from "express";

export function sendSuccess(res: Response, data: unknown, meta?: Record<string, unknown>, status = 200) {
    res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}
