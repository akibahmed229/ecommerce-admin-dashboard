import express, { type Express, type Request, type Response } from "express"; // Default import
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { logger } from "@core/middleware/logEvents";
import { corsOptions } from "@core/config/corsOptions";
import { errorHandler } from "@core/middleware/errorHandler";
import { apiRouter } from "@core/routes";


export const app: Express = express();

// custom middleware logger
app.use(logger);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// parse cookie from request
app.use(cookieParser());

// built-in middleware for json
app.use(express.json());

//serve static files
app.use("/", express.static(path.join(__dirname, "../", "/public")));

// get route for homepage match: /, /index, /index.html
app.get(/^\/$|^\/index(.html)?$/, (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../", "views", "index.html"));
});


// routes
app.use("/api/v1", apiRouter);


// fallback for 404
app.use((req: Request, res: Response) => {
    res.status(404);
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "../", "views", "404.html"));
    } else if (req.accepts("json")) {
        res.json({ error: "404 Not Found" });
    } else {
        res.type("txt").send("404 Not Found");
    }
});

app.use(errorHandler);
