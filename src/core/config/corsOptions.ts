import { CorsOptions } from "cors";

// Allowed origins (only requests from these URLs are permitted)
const whiteList = ["http://127.0.0.1:3500", "http://127.0.0.1:3001", "http://localhost:3000", "http://127.0.0.1:3000"];

// CORS configuration object
export const corsOptions: CorsOptions = {
    // Check if the request's origin is in the whitelist
    origin: (
        origin: string | undefined, // Origin of the incoming request
        callback: (err: Error | null, allow?: boolean) => void, // Callback to approve/reject
    ) => {
        // Allow if origin is in whitelist OR no origin (e.g., Postman requests)
        if (!origin || whiteList.includes(origin)) {
            callback(null, true);
        } else {
            // Block request if origin is not allowed
            callback(new Error("Not allowed by CORS"));
        }
    },

    // Success status for legacy browsers that choke on 204
    optionsSuccessStatus: 200,
};
