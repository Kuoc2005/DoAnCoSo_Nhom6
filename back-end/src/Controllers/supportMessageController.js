import mongoose from "mongoose";
import SupportMessage from "../models/supportMessage.js";
import User from "../models/user.js";
import { notifySupportMessage } from "../lib/chatWs.js";

function serializeMessage(doc) {
    return {
        id: String(doc._id),
        threadUserId: String(doc.threadUserId),
        authorId: String(doc.authorId),
        authorRole: doc.authorRole,
        text: doc.text,
        createdAt: doc.createdAt,
    };
}

export async function getMySupportThread(req, res) {
    try {
        const uid = req.user._id;
        const list = await SupportMessage.find({ threadUserId: uid }).sort({ createdAt: 1 }).limit(500).lean();
        return res.json({ messages: list.map(serializeMessage) });
    } catch (e) {
        console.error("getMySupportThread:", e);
        return res.status(500).json({ message: "Lỗi tải tin nhắn." });
    }
}

export async function postMySupportMessage(req, res) {
    try {
        const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
        if (!text || text.length > 2000) {
            return res.status(400).json({ message: "Nội dung không hợp lệ." });
        }
        const threadUserId = req.user._id;
        const authorRole = req.user.role === "admin" ? "admin" : "user";
        const doc = await SupportMessage.create({
            threadUserId,
            authorId: req.user._id,
            authorRole,
            text,
        });
        const payload = serializeMessage(doc.toObject());
        notifySupportMessage({ threadUserId: String(threadUserId), message: payload });
        return res.status(201).json({ message: payload });
    } catch (e) {
        console.error("postMySupportMessage:", e);
        return res.status(500).json({ message: "Không gửi được tin nhắn." });
    }
}

export async function listSupportThreadsAdmin(req, res) {
    try {
        const agg = await SupportMessage.aggregate([
            { $group: { _id: "$threadUserId", lastAt: { $max: "$createdAt" }, count: { $sum: 1 } } },
            { $sort: { lastAt: -1 } },
            { $limit: 200 },
        ]);
        const ids = agg.map((a) => a._id).filter(Boolean);
        const users = await User.find({ _id: { $in: ids } }).select("username displayName email").lean();
        const userMap = new Map(users.map((u) => [String(u._id), u]));
        const threads = agg.map((row) => {
            const u = userMap.get(String(row._id));
            return {
                threadUserId: String(row._id),
                username: u?.username ?? "",
                displayName: u?.displayName ?? "(Không tìm thấy user)",
                messageCount: row.count,
                lastAt: row.lastAt,
            };
        });
        return res.json({ threads });
    } catch (e) {
        console.error("listSupportThreadsAdmin:", e);
        return res.status(500).json({ message: "Không tải được danh sách hội thoại." });
    }
}

export async function getSupportThreadMessagesAdmin(req, res) {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "ID không hợp lệ." });
        }
        const list = await SupportMessage.find({ threadUserId: userId }).sort({ createdAt: 1 }).limit(500).lean();
        return res.json({ messages: list.map(serializeMessage) });
    } catch (e) {
        console.error("getSupportThreadMessagesAdmin:", e);
        return res.status(500).json({ message: "Lỗi tải tin nhắn." });
    }
}

export async function postSupportReplyAdmin(req, res) {
    try {
        const threadUserIdRaw = req.body?.threadUserId;
        const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
        if (!mongoose.Types.ObjectId.isValid(threadUserIdRaw) || !text) {
            return res.status(400).json({ message: "Thiếu threadUserId hoặc nội dung." });
        }
        const target = await User.findById(threadUserIdRaw).select("_id").lean();
        if (!target) {
            return res.status(404).json({ message: "Người dùng không tồn tại." });
        }
        const doc = await SupportMessage.create({
            threadUserId: target._id,
            authorId: req.user._id,
            authorRole: "admin",
            text,
        });
        const payload = serializeMessage(doc.toObject());
        notifySupportMessage({ threadUserId: String(target._id), message: payload });
        return res.status(201).json({ message: payload });
    } catch (e) {
        console.error("postSupportReplyAdmin:", e);
        return res.status(500).json({ message: "Không gửi được phản hồi." });
    }
}
