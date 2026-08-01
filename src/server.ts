import dotenv from "dotenv";
import { app } from "./app"

// setup env secret
dotenv.config({
    override: true,
    path: './.env'
});

const port = process.env.PORT || 3500;


// start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
