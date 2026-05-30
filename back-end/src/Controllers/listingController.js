import User from "../models/user.js";
import Booking from "../models/booking.js";
import { GAME_CATALOG, coverUrlForSlug } from "../lib/gameTaxonomy.js";
import { escapeRegex, featuredGameSlugFromUser, hubProviderAccountQuery, mapUserToListingPayload } from "../lib/listingMappers.js";
import { aggregateRentStatsForProviders } from "../lib/providerGameProfile.js";

/** Bảng xếp hạng uy tín: rating × log(review). */
function leaderboardScore(u, rentBySlug = null) {
    const pl = u.playerListing ?? {};
    const r = typeof pl.ratingAvg === "number" ? pl.ratingAvg : 4.5;
    const n = typeof pl.reviewCount === "number" ? pl.reviewCount : 0;
    const slug = featuredGameSlugFromUser(u, rentBySlug);
    const rentCount = rentBySlug ? Object.values(rentBySlug).reduce((s, x) => s + (x?.bookingCount || 0), 0) : 0;
    const rentBoost = rentCount > 0 ? Math.log10(rentCount + 1) * 0.15 : 0;
    return r * Math.log10(n + 10) + rentBoost;
}

function mapProviderRow(u, rentBySlug = null) {
    const base = mapUserToListingPayload(u, rentBySlug);
    return base;
}

export async function getLeaderboard(req, res) {
    try {
        const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 30));
        const game =
            typeof req.query.game === "string" && req.query.game.trim() && req.query.game !== "all"
                ? req.query.game.trim().toLowerCase()
                : "";

        const docs = await User.find(hubProviderAccountQuery())
            .sort({ "playerListing.ratingAvg": -1, "playerListing.reviewCount": -1 })
            .limit(200)
            .lean();

        const rentMap = await aggregateRentStatsForProviders(docs.map((d) => d._id));

        let ranked = docs.map((u) => {
            const rentBySlug = rentMap.get(String(u._id)) ?? null;
            const base = mapProviderRow(u, rentBySlug);
            return {
                ...base,
                rank: 0,
                leaderboardScore: Math.round(leaderboardScore(u, rentBySlug) * 100) / 100,
            };
        });

        if (game) {
            ranked = ranked.filter((row) => row.featuredGameSlug === game || row.games.includes(game));
        }

        ranked.sort((a, b) => b.leaderboardScore - a.leaderboardScore);
        ranked = ranked.slice(0, limit);
        ranked.forEach((row, i) => {
            row.rank = i + 1;
        });

        return res.json({
            entries: ranked,
            formula: "ratingAvg × log10(reviewCount + 10) + bonus thuê",
            gameFilter: game || null,
        });
    } catch (e) {
        console.error("getLeaderboard:", e);
        return res.status(500).json({ message: "Không tải được bảng xếp hạng." });
    }
}

/** Xếp hạng nền tảng: nạp tiền, chi tiêu thuê, thu nhập provider, uy tín provider. */
export async function getSocialLeaderboards(req, res) {
    try {
        const limit = Math.min(40, Math.max(5, parseInt(req.query.limit, 10) || 15));

        const topTopUpDocs = await User.find({})
            .select("username displayName avatarUrl totalTopUpVnd")
            .sort({ totalTopUpVnd: -1, createdAt: -1 })
            .limit(limit)
            .lean();

        const topTopUp = topTopUpDocs.map((u, i) => ({
            rank: i + 1,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl ? String(u.avatarUrl).trim() : undefined,
            totalTopUpVnd: Math.max(0, Number(u.totalTopUpVnd) || 0),
        }));

        const topRenters = await Booking.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: "$renterUserId", totalSpendVnd: { $sum: "$grossVnd" }, bookingCount: { $sum: 1 } } },
            { $sort: { totalSpendVnd: -1 } },
            { $limit: limit },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    username: "$user.username",
                    displayName: "$user.displayName",
                    avatarUrl: "$user.avatarUrl",
                    totalSpendVnd: 1,
                    bookingCount: 1,
                },
            },
        ]);

        const topProviderEarners = await Booking.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: "$providerUserId",
                    totalEarnedVnd: { $sum: { $subtract: ["$grossVnd", "$platformFeeVnd"] } },
                    bookingCount: { $sum: 1 },
                },
            },
            { $sort: { totalEarnedVnd: -1 } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            {
                $match: {
                    "user.accountType": "provider",
                    "user.role": { $ne: "admin" },
                    "user.playerListing.isVerifiedProvider": true,
                },
            },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    username: "$user.username",
                    displayName: "$user.displayName",
                    avatarUrl: "$user.avatarUrl",
                    featuredGameSlug: "$user.playerListing.featuredGameSlug",
                    totalEarnedVnd: 1,
                    bookingCount: 1,
                },
            },
        ]);

        const providerDocs = await User.find(hubProviderAccountQuery())
            .sort({ "playerListing.ratingAvg": -1, "playerListing.reviewCount": -1 })
            .limit(Math.max(limit, 30))
            .lean();
        const rentMap = await aggregateRentStatsForProviders(providerDocs.map((d) => d._id));
        const topRated = providerDocs
            .map((u) => {
                const rentBySlug = rentMap.get(String(u._id)) ?? null;
                const base = mapProviderRow(u, rentBySlug);
                return {
                    ...base,
                    rank: 0,
                    leaderboardScore: Math.round(leaderboardScore(u, rentBySlug) * 100) / 100,
                };
            })
            .sort((a, b) => b.leaderboardScore - a.leaderboardScore)
            .slice(0, limit);
        topRated.forEach((row, i) => {
            row.rank = i + 1;
        });

        return res.json({
            topTopUp,
            topRenters: topRenters.map((r, i) => ({ rank: i + 1, ...r })),
            topProviderEarners: topProviderEarners.map((r, i) => ({
                rank: i + 1,
                ...r,
                game: GAME_CATALOG[r.featuredGameSlug]?.label ?? r.featuredGameSlug ?? "—",
                listingCoverUrl: coverUrlForSlug(r.featuredGameSlug) || undefined,
            })),
            topRatedProviders: topRated,
        });
    } catch (e) {
        console.error("getSocialLeaderboards:", e);
        return res.status(500).json({ message: "Không tải được bảng xếp hạng." });
    }
}

export async function getListings(req, res) {
    try {
        const game = typeof req.query.game === "string" ? req.query.game.trim().toLowerCase() : "";
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

        const conditions = [hubProviderAccountQuery()];
        if (game && game !== "all") {
            conditions.push({
                $or: [
                    { "playerListing.featuredGameSlug": game },
                    { "playerListing.primaryGameSlug": game },
                    { "gamingProfile.favoriteSlugs": game },
                    { "gamingProfile.playHistory.gameSlug": game },
                ],
            });
        }
        if (q) {
            const rx = new RegExp(escapeRegex(q), "i");
            conditions.push({
                $or: [{ displayName: rx }, { username: rx }, { "playerListing.rankLabel": rx }],
            });
        }

        const filter = conditions.length > 1 ? { $and: conditions } : conditions[0];

        const page = Math.min(500, Math.max(1, parseInt(req.query.page, 10) || 1));
        const pageSize = Math.min(36, Math.max(1, parseInt(req.query.pageSize, 10) || 12));
        const skip = (page - 1) * pageSize;

        const [total, docs] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter).sort({ "playerListing.ratingAvg": -1, createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        ]);

        const rentMap = await aggregateRentStatsForProviders(docs.map((d) => d._id));
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return res.json({
            listings: docs.map((u) => mapUserToListingPayload(u, rentMap.get(String(u._id)) ?? null)),
            total,
            page,
            pageSize,
            totalPages,
        });
    } catch (e) {
        console.error("getListings:", e);
        return res.status(500).json({ message: "Không tải được danh sách." });
    }
}
