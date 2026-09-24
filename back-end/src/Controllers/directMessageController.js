import mongoose from "mongoose";
import DirectMessage from "../models/directMessage.js";
import User from "../models/user.js";
import { notifyDirectMessage } from "../lib/chatWs.js";

function sortedPair(id1, id2) {
    const a = String(id1);
    const b = String(id2);
    return a < b ? [a, b] : [b, a];
}

function serializeMessage(doc) {
    return {
        id: String(doc._id),
        participantA: String(doc.participantA),
        participantB: String(doc.participantB),
        senderId: String(doc.senderId),
        text: doc.text,
        createdAt: doc.createdAt,
    };
}

function pairFilter(myId, otherId) {
    const [a, b] = sortedPair(myId, otherId);
    return { participantA: a, participantB: b };
}

/** GET /api/messages/conversations */
export async function listMyConversations(req, res) {
    try {
        const myId = req.user._id;
        const agg = await DirectMessage.aggregate([
            {
                $match: {
                    $or: [{ participantA: myId }, { participantB: myId }],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: { a: "$participantA", b: "$participantB" },
                    lastAt: { $first: "$createdAt" },
                    lastText: { $first: "$text" },
                    lastSenderId: { $first: "$senderId" },
                    messageCount: { $sum: 1 },
                },
            },
            { $sort: { lastAt: -1 } },
            { $limit: 100 },
        ]);

        const otherIds = agg.map((row) => {
            const a = String(row._id.a);
            const b = String(row._id.b);
            return a === String(myId) ? b : a;
        });

        const users = await User.find({ _id: { $in: otherIds } })
            .select("username displayName avatarUrl accountType")
            .lean();
        const userMap = new Map(users.map((u) => [String(u._id), u]));

        const conversations = agg.map((row) => {
            const a = String(row._id.a);
            const b = String(row._id.b);
            const otherId = a === String(myId) ? b : a;
            const u = userMap.get(otherId);
            return {
                otherUserId: otherId,
                username: u?.username ?? "",
                displayName: u?.displayName ?? "(Đã xóa)",
                avatarUrl: u?.avatarUrl?.trim() ? String(u.avatarUrl).trim() : undefined,
                accountType: u?.accountType ?? "renter",
                lastText: row.lastText,
                lastSenderId: String(row.lastSenderId),
                lastAt: row.lastAt,
                messageCount: row.messageCount,
            };
        });

        return res.json({ conversations });
    } catch (e) {
        console.error("listMyConversations:", e);
        return res.status(500).json({ message: "Không tải được hội thoại." });
    }
}

/** GET /api/messages/direct/:otherUserId */
export async function getDirectThread(req, res) {
    try {
        const { otherUserId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({ message: "ID không hợp lệ." });
        }
        if (String(otherUserId) === String(req.user._id)) {
            return res.status(400).json({ message: "Không thể chat với chính mình." });
        }
        const other = await User.findById(otherUserId).select("_id username displayName avatarUrl accountType").lean();
        if (!other) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        const list = await DirectMessage.find(pairFilter(req.user._id, otherUserId))
            .sort({ createdAt: 1 })
            .limit(500)
            .lean();

        return res.json({
            otherUser: {
                id: String(other._id),
                username: other.username,
                displayName: other.displayName,
                avatarUrl: other.avatarUrl?.trim() ? String(other.avatarUrl).trim() : undefined,
                accountType: other.accountType ?? "renter",
            },
            messages: list.map(serializeMessage),
        });
    } catch (e) {
        console.error("getDirectThread:", e);
        return res.status(500).json({ message: "Lỗi tải tin nhắn." });
    }
}

/** POST /api/messages/direct — body: { toUserId?, toUsername?, text } */
export async function postDirectMessage(req, res) {
    try {
        const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
        if (!text || text.length > 2000) {
            return res.status(400).json({ message: "Nội dung không hợp lệ." });
        }

        let target = null;
        const toUserId = req.body?.toUserId;
        const toUsername = typeof req.body?.toUsername === "string" ? req.body.toUsername.trim().toLowerCase() : "";

        if (toUserId && mongoose.Types.ObjectId.isValid(toUserId)) {
            target = await User.findById(toUserId).select("_id username displayName").lean();
        } else if (toUsername) {
            target = await User.findOne({ username: toUsername }).select("_id username displayName").lean();
        }

        if (!target) {
            return res.status(400).json({ message: "Thiếu toUserId/toUsername hoặc người nhận không tồn tại." });
        }
        if (String(target._id) === String(req.user._id)) {
            return res.status(400).json({ message: "Không thể gửi tin cho chính mình." });
        }

        const [a, b] = sortedPair(req.user._id, target._id);
        const doc = await DirectMessage.create({
            participantA: a,
            participantB: b,
            senderId: req.user._id,
            text,
        });
        const payload = serializeMessage(doc.toObject());
        notifyDirectMessage({ participantIds: [a, b], message: payload });
        return res.status(201).json({ message: payload });
    } catch (e) {
        console.error("postDirectMessage:", e);
        return res.status(500).json({ message: "Không gửi được tin nhắn." });
    }
}
