import { NextFunction, Request, RequestHandler, Response } from "express";


export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {

    return function(req: Request, res: Response, next: NextFunction) {
        fn(req, res, next).catch(next);
    };
}
