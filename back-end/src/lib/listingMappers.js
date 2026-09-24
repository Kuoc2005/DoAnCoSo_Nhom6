import { GAME_CATALOG, ALLOWED_SLUGS, coverUrlForSlug, normalizeSlug } from "./gameTaxonomy.js";
import { computeFeaturedGameSlug, topPlayedSlugFromUser } from "./providerGameProfile.js";

const GRADIENTS = [
    "from-[#4C1D95] to-[#06B6D4]",
    "from-[#1E3A8A] to-[#38BDF8]",
    "from-[#B45309] to-[#FBBF24]",
    "from-[#BE185D] to-[#FB7185]",
    "from-[#EA580C] to-[#F97316]",
    "from-[#78350F] to-[#D97706]",
    "from-[#0369A1] to-[#22D3EE]",
    "from-[#4338CA] to-[#A78BFA]",
];

export function avatarGradientForUsername(username) {
    const s = String(username || "x");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
}

/** @deprecated — dùng featuredGameSlugFromUser */
export function primarySlugFromUser(u) {
    return featuredGameSlugFromUser(u);
}

/** Game hiển thị: cache featuredGameSlug hoặc tính từ rentStats / lịch sử chơi. */
export function featuredGameSlugFromUser(u, rentBySlug = null) {
    const cached = normalizeSlug(u.playerListing?.featuredGameSlug);
    if (cached && ALLOWED_SLUGS.includes(cached) && !rentBySlug) {
        return cached;
    }
    return computeFeaturedGameSlug(u, rentBySlug);
}

export function gameSlugsForFilter(u) {
    const set = new Set();
    const featured = featuredGameSlugFromUser(u);
    set.add(featured);
    const played = topPlayedSlugFromUser(u);
    if (played) set.add(played);
    const primary = normalizeSlug(u.playerListing?.primaryGameSlug);
    if (ALLOWED_SLUGS.includes(primary)) set.add(primary);
    for (const s of u.gamingProfile?.favoriteSlugs ?? []) {
        const x = normalizeSlug(s);
        if (ALLOWED_SLUGS.includes(x)) set.add(x);
    }
    for (const row of u.gamingProfile?.playHistory ?? []) {
        const x = normalizeSlug(row?.gameSlug);
        if (ALLOWED_SLUGS.includes(x)) set.add(x);
    }
    return [...set];
}

/** Ảnh bìa theo game nổi bật (hay thuê / hay chơi). */
export function resolveListingCoverUrl(u, rentBySlug = null) {
    const slug = featuredGameSlugFromUser(u, rentBySlug);
    return coverUrlForSlug(slug) || undefined;
}

export function mapUserToListingPayload(u, rentBySlug = null) {
    const slug = featuredGameSlugFromUser(u, rentBySlug);
    const label = GAME_CATALOG[slug]?.label ?? slug;
    const pl = u.playerListing ?? {};
    return {
        id: String(u._id),
        username: u.username,
        name: u.displayName,
        game: label,
        rank: pl.rankLabel?.trim() || "—",
        pricePerHour: typeof pl.pricePerHour === "number" ? pl.pricePerHour : 55000,
        rating: typeof pl.ratingAvg === "number" ? pl.ratingAvg : 4.5,
        reviewCount: typeof pl.reviewCount === "number" ? pl.reviewCount : 0,
        online: Boolean(pl.isLive),
        badge: pl.ratingAvg >= 4.85 ? "Uy tín" : pl.isLive ? "Live" : undefined,
        voiceOk: pl.voiceOk !== false,
        games: gameSlugsForFilter(u),
        avatarClassName: avatarGradientForUsername(u.username),
        avatarUrl: u.avatarUrl?.trim() ? String(u.avatarUrl).trim() : undefined,
        listingCoverUrl: resolveListingCoverUrl(u, rentBySlug),
        featuredGameSlug: slug,
        primaryGameSlug: slug,
    };
}

export function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Chỉ người cho thuê đã được duyệt; không hiển thị tài khoản admin trên hub/trang chủ. */
export function hubProviderAccountQuery() {
    return {
        accountType: "provider",
        role: { $ne: "admin" },
        "playerListing.isVerifiedProvider": true,
    };
}
