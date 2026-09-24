import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import { promoteBootstrapAdmin } from "./lib/bootstrapAdmin.js";
import { attachSupportChatWebSocket } from "./lib/chatWs.js";
import authRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import adminRoute from "./routes/adminRoute.js";
import matchRoute from "./routes/matchRoute.js";
import catalogRoute from "./routes/catalogRoute.js";
import listingRoute from "./routes/listingRoute.js";
import playerPublicRoute from "./routes/playerPublicRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import rentalRoute from "./routes/rentalRoute.js";
import messageRoute from "./routes/messageRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

/** Cho phép nhiều origin (dev thường gặp localhost vs 127.0.0.1). */
const corsOrigin =
    process.env.CORS_ORIGIN ||
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173";

app.use(
    cors({
        origin: corsOrigin.split(",").map((s) => s.trim()),
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/match", matchRoute);
app.use("/api/catalog", catalogRoute);
app.use("/api/listings", listingRoute);
app.use("/api/players", playerPublicRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/rentals", rentalRoute);
app.use("/api/messages", messageRoute);

const server = http.createServer(app);
attachSupportChatWebSocket(server);

connectDB()
    .then(async () => {
        await promoteBootstrapAdmin();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
