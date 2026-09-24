import mongoose from "mongoose";
import Booking from "../models/booking.js";
import User from "../models/user.js";
import { ALLOWED_SLUGS, coverUrlForSlug, isAllowedSlug, normalizeSlug } from "./gameTaxonomy.js";

/** Game chơi nhiều giờ nhất từ lịch sử. */
export function topPlayedSlugFromUser(u) {
    let bestSlug = "";
    let bestHours = -1;
    for (const row of u.gamingProfile?.playHistory ?? []) {
        const slug = normalizeSlug(row?.gameSlug);
        if (!isAllowedSlug(slug)) continue;
        const hours = Math.max(0, Number(row.hoursPlayed) || 0);
        if (hours > bestHours) {
            bestHours = hours;
            bestSlug = slug;
        }
    }
    return bestSlug;
}

/** Chọn slug từ thống kê thuê: ưu tiên số lượt, rồi tổng giờ. */
export function pickTopRentedSlug(rentBySlug) {
    let best = "";
    let bestCount = -1;
    let bestHours = -1;
    for (const [raw, stats] of Object.entries(rentBySlug ?? {})) {
        const slug = normalizeSlug(raw);
        if (!isAllowedSlug(slug)) continue;
        const count = Math.max(0, Number(stats?.bookingCount) || 0);
        const hours = Math.max(0, Number(stats?.totalHours) || 0);
        if (count > bestCount || (count === bestCount && hours > bestHours)) {
            best = slug;
            bestCount = count;
            bestHours = hours;
        }
    }
    return bestCount > 0 ? best : "";
}

/**
 * Game hiển thị trên hub / ảnh bìa:
 * 1) Hay được thuê nhất  2) Hay chơi nhất  3) featuredGameSlug cache  4) primary  5) yêu thích
 */
export function computeFeaturedGameSlug(u, rentBySlug = null) {
    const rented = pickTopRentedSlug(rentBySlug ?? {});
    if (rented) return rented;

    const played = topPlayedSlugFromUser(u);
    if (played) return played;

    const cached = normalizeSlug(u.playerListing?.featuredGameSlug);
    if (cached && isAllowedSlug(cached)) return cached;

    const primary = normalizeSlug(u.playerListing?.primaryGameSlug);
    if (primary && isAllowedSlug(primary)) return primary;

    const fav = u.gamingProfile?.favoriteSlugs?.map(normalizeSlug).find(isAllowedSlug);
    if (fav) return fav;

    return "valorant";
}

/** Thống kê thuê theo game cho một provider. */
export async function aggregateRentStatsForProvider(providerUserId) {
    const pid = providerUserId;
    const rows = await Booking.aggregate([
        { $match: { providerUserId: pid, status: "completed" } },
        {
            $lookup: {
                from: "users",
                localField: "providerUserId",
                foreignField: "_id",
                as: "prov",
            },
        },
        { $unwind: { path: "$prov", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                effectiveSlug: {
                    $cond: [
                        {
                            $and: [{ $ne: ["$gameSlug", ""] }, { $ne: ["$gameSlug", null] }],
                        },
                        "$gameSlug",
                        { $ifNull: ["$prov.playerListing.primaryGameSlug", "valorant"] },
                    ],
                },
            },
        },
        {
            $group: {
                _id: "$effectiveSlug",
                bookingCount: { $sum: 1 },
                totalHours: { $sum: "$hours" },
            },
        },
    ]);

    const out = {};
    for (const row of rows) {
        const slug = normalizeSlug(row._id);
        if (!isAllowedSlug(slug)) continue;
        out[slug] = {
            bookingCount: row.bookingCount,
            totalHours: row.totalHours,
        };
    }
    return out;
}

/** Batch thống kê thuê cho nhiều provider — Map<providerId, rentBySlug>. */
export async function aggregateRentStatsForProviders(providerIds) {
    const ids = [...new Set(providerIds.map(String))].filter(Boolean);
    const map = new Map();
    if (ids.length === 0) return map;

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(String(id)));

    const rows = await Booking.aggregate([
        { $match: { providerUserId: { $in: objectIds }, status: "completed" } },
        {
            $lookup: {
                from: "users",
                localField: "providerUserId",
                foreignField: "_id",
                as: "prov",
            },
        },
        { $unwind: { path: "$prov", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                effectiveSlug: {
                    $cond: [
                        {
                            $and: [{ $ne: ["$gameSlug", ""] }, { $ne: ["$gameSlug", null] }],
                        },
                        "$gameSlug",
                        { $ifNull: ["$prov.playerListing.primaryGameSlug", "valorant"] },
                    ],
                },
            },
        },
        {
            $group: {
                _id: {
                    providerUserId: "$providerUserId",
                    gameSlug: "$effectiveSlug",
                },
                bookingCount: { $sum: 1 },
                totalHours: { $sum: "$hours" },
            },
        },
    ]);

    for (const row of rows) {
        const pid = String(row._id.providerUserId);
        const slug = normalizeSlug(row._id.gameSlug);
        if (!isAllowedSlug(slug)) continue;
        if (!map.has(pid)) map.set(pid, {});
        map.get(pid)[slug] = {
            bookingCount: row.bookingCount,
            totalHours: row.totalHours,
        };
    }
    return map;
}

/** Tính lại featuredGameSlug + ảnh bìa và lưu DB. */
export async function syncProviderFeaturedGame(providerUserId) {
    const user = await User.findById(providerUserId).lean();
    if (!user) return null;

    const rentBySlug = await aggregateRentStatsForProvider(providerUserId);
    const slug = computeFeaturedGameSlug(user, rentBySlug);
    const cover = coverUrlForSlug(slug);

    await User.updateOne(
        { _id: providerUserId },
        {
            $set: {
                "playerListing.featuredGameSlug": slug,
                "playerListing.listingCoverUrl": cover,
            },
        }
    );

    return slug;
}

/** Đồng bộ toàn bộ provider (seed / bảo trì). */
export async function syncAllProvidersFeaturedGame() {
    const providers = await User.find({
        accountType: "provider",
        "playerListing.isVerifiedProvider": true,
    })
        .select("_id")
        .lean();

    let count = 0;
    for (const p of providers) {
        await syncProviderFeaturedGame(p._id);
        count += 1;
    }
    return count;
}

export function gameFilterOrClause(slug) {
    return {
        $or: [
            { "playerListing.featuredGameSlug": slug },
            { "playerListing.primaryGameSlug": slug },
            { "gamingProfile.favoriteSlugs": slug },
            { "gamingProfile.playHistory.gameSlug": slug },
        ],
    };
}
