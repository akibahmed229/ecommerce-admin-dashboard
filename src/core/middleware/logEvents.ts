import { format } from "date-fns";
import { v7 as uuid } from "uuid";

import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { Request, Response, NextFunction } from "express";

export const logEvents = async (message: string, logName: string) => {
    const dateTime = `${format(new Date(), "yyyyMMdd\tHH:mm:ss")}`;
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    try {
        // check if the dir exit if not then create
        if (!fs.existsSync(path.join(__dirname, "../../../", "logs"))) {
            await fsPromises.mkdir(path.join(__dirname, "../../../", "logs"));
        }

        // then append the log file
        await fsPromises.appendFile(
            path.join(__dirname, "../../../", "logs", logName),
            logItem,
        );
    } catch (error) {
        console.log(error);
    }
};

export const logger = (req: Request, res: Response, next: NextFunction) => {
    logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, "reqLogs.txt");
    console.log(`${req.method} ${req.path}`);

    next();
};
