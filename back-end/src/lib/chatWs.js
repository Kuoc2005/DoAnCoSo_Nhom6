import { WebSocketServer } from "ws";
import { parse } from "url";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

let wss = null;

/**
 * Gửi tin mới tới: mọi socket admin + user đang mở đúng thread (threadUserId).
 */
export function notifySupportMessage({ threadUserId, message }) {
    if (!wss) return;
    const data = JSON.stringify({ type: "support_message", threadUserId: String(threadUserId), message });
    for (const client of wss.clients) {
        if (client.readyState !== 1) continue;
        if (client.isAdmin || String(client.userId) === String(threadUserId)) {
            try {
                client.send(data);
            } catch {
                /* ignore */
            }
        }
    }
}

/** Gửi tin riêng tới cả hai người trong cuộc hội thoại. */
export function notifyDirectMessage({ participantIds, message }) {
    if (!wss) return;
    const ids = new Set(participantIds.map(String));
    const data = JSON.stringify({ type: "direct_message", participantIds: [...ids], message });
    for (const client of wss.clients) {
        if (client.readyState !== 1) continue;
        if (ids.has(String(client.userId))) {
            try {
                client.send(data);
            } catch {
                /* ignore */
            }
        }
    }
}

export function attachSupportChatWebSocket(server) {
    if (wss) return wss;
    wss = new WebSocketServer({ server, path: "/ws/chat" });
    wss.on("connection", async (ws, req) => {
        try {
            const { query } = parse(req.url || "", true);
            const token = query.token;
            if (!token || typeof token !== "string") {
                ws.close(1008, "Unauthorized");
                return;
            }
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const u = await User.findById(decoded.userId).select("role").lean();
            if (!u) {
                ws.close(1008, "Unauthorized");
                return;
            }
            ws.userId = String(decoded.userId);
            ws.isAdmin = u.role === "admin";
        } catch {
            try {
                ws.close(1008, "Unauthorized");
            } catch {
                /* ignore */
            }
            return;
        }
        ws.on("error", () => { });
    });
    return wss;
}
