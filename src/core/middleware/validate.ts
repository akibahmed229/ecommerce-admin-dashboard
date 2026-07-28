import { RequestHandler } from "express";
import { ZodObject } from "zod";

export const validate =
    (schema: ZodObject): RequestHandler =>
        (req, res, next) => {
            const result = schema.parse({ body: req.body, query: req.query, params: req.params });
            if (result.body) req.body = result.body;
            if (result.params) req.params = result.params as any;
            next(); // zod throws synchronously — Express catches it into errorHandler either way
        };
