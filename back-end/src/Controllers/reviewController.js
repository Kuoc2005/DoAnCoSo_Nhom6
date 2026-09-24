import PlayerReview from "../models/playerReview.js";
import User from "../models/user.js";
import { normalizeSlug } from "../lib/gameTaxonomy.js";

async function syncListingRatingFromReviews(targetUserId) {
    const agg = await PlayerReview.aggregate([
        { $match: { targetUserId } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const row = agg[0];
    if (!row) {
        await User.findByIdAndUpdate(targetUserId, {
            $set: {
                "playerListing.ratingAvg": 4.5,
                "playerListing.reviewCount": 0,
            },
        });
        return;
    }
    const avg = Math.round(row.avg * 10) / 10;
    await User.findByIdAndUpdate(targetUserId, {
        $set: {
            "playerListing.ratingAvg": avg,
            "playerListing.reviewCount": row.count,
        },
    });
}

export async function listReviewsForPlayer(req, res) {
    try {
        const username = normalizeSlug(req.params.username);
        if (!username) {
            return res.status(400).json({ message: "Thiếu username." });
        }
        const target = await User.findOne({ username }).select("_id").lean();
        if (!target) {
            return res.status(404).json({ message: "Không tìm thấy người chơi." });
        }

        const reviews = await PlayerReview.find({ targetUserId: target._id })
            .populate("authorId", "username displayName avatarUrl")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const mapped = reviews.map((r) => ({
            id: String(r._id),
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            author: r.authorId
                ? {
                      username: r.authorId.username,
                      displayName: r.authorId.displayName,
                  }
                : null,
        }));

        return res.json({ reviews: mapped });
    } catch (e) {
        console.error("listReviewsForPlayer:", e);
        return res.status(500).json({ message: "Không tải được đánh giá." });
    }
}

/**
 * POST /api/reviews  { targetUsername, rating, comment? }
 */
export async function createReview(req, res) {
    try {
        const { targetUsername, rating, comment } = req.body ?? {};
        const un = normalizeSlug(targetUsername);
        const rNum = Number(rating);
        if (!un || Number.isNaN(rNum) || rNum < 1 || rNum > 5) {
            return res.status(400).json({ message: "Thiếu targetUsername hoặc rating (1–5)." });
        }

        const target = await User.findOne({ username: un });
        if (!target) {
            return res.status(404).json({ message: "Không tìm thấy người được đánh giá." });
        }
        if (String(target._id) === String(req.user._id)) {
            return res.status(400).json({ message: "Không thể tự đánh giá chính mình." });
        }

        const text = comment != null ? String(comment).trim().slice(0, 600) : "";

        await PlayerReview.findOneAndUpdate(
            { authorId: req.user._id, targetUserId: target._id },
            { $set: { rating: Math.round(rNum), comment: text } },
            { upsert: true, new: true }
        );

        await syncListingRatingFromReviews(target._id);

        return res.status(201).json({ ok: true });
    } catch (e) {
        console.error("createReview:", e);
        return res.status(500).json({ message: "Không lưu được đánh giá." });
    }
}
