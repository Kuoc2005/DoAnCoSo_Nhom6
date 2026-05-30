import User from "../models/user.js";
import { ALLOWED_SLUGS, isAllowedSlug, normalizeSlug } from "../lib/gameTaxonomy.js";
import { syncProviderFeaturedGame } from "../lib/providerGameProfile.js";

export const authMe = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error authenticating user:", error);
        return res.status(500).json({ message: "Failed to authenticate user" });
    }
};

/**
 * PATCH /api/user/gaming-profile
 * Body: { favoriteSlugs?: string[], playHistory?: { gameSlug, hoursPlayed, sessionsCount?, lastPlayedAt? }[] }
 */
export const updateGamingProfile = async (req, res) => {
    try {
        const { favoriteSlugs, playHistory } = req.body ?? {};

        const update = {};

        if (favoriteSlugs != null) {
            if (!Array.isArray(favoriteSlugs)) {
                return res.status(400).json({ message: "favoriteSlugs phải là mảng." });
            }
            const cleaned = [...new Set(favoriteSlugs.map(normalizeSlug).filter(isAllowedSlug))];
            update["gamingProfile.favoriteSlugs"] = cleaned;
        }

        if (playHistory != null) {
            if (!Array.isArray(playHistory)) {
                return res.status(400).json({ message: "playHistory phải là mảng." });
            }
            const rows = [];
            for (const row of playHistory) {
                if (!row?.gameSlug || !isAllowedSlug(row.gameSlug)) continue;
                const slug = normalizeSlug(row.gameSlug);
                const hoursPlayed = Math.min(50000, Math.max(0, Number(row.hoursPlayed) || 0));
                const sessionsCount = Math.max(0, Math.floor(Number(row.sessionsCount) || 0));
                let lastPlayedAt;
                if (row.lastPlayedAt) {
                    const d = new Date(row.lastPlayedAt);
                    if (!Number.isNaN(d.getTime())) lastPlayedAt = d;
                }
                rows.push({
                    gameSlug: slug,
                    hoursPlayed,
                    sessionsCount,
                    ...(lastPlayedAt ? { lastPlayedAt } : {}),
                });
            }
            update["gamingProfile.playHistory"] = rows.slice(0, 64);
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "Không có trường hợp lệ để cập nhật." });
        }

        const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select("-hashedPassword");

        if (user?.accountType === "provider") {
            await syncProviderFeaturedGame(user._id);
            const refreshed = await User.findById(user._id).select("-hashedPassword").lean();
            return res.status(200).json({ user: refreshed });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error("updateGamingProfile:", error);
        return res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

/**
 * PATCH /api/user/player-listing — giá, rank, game chính hiển thị trên hub
 */
export const updatePlayerListing = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.accountType !== "provider") {
            return res.status(403).json({
                message: "Chỉ người cho thuê mới chỉnh thông tin hiển thị trên Khám phá. Hãy dùng mục Studio cho thuê trong Hồ sơ.",
            });
        }
        const b = req.body ?? {};
        const update = {};

        if (b.pricePerHour != null) {
            const n = Number(b.pricePerHour);
            if (Number.isNaN(n) || n < 0) {
                return res.status(400).json({ message: "Giá không hợp lệ." });
            }
            update["playerListing.pricePerHour"] = Math.min(50_000_000, n);
        }
        if (b.rankLabel != null) {
            update["playerListing.rankLabel"] = String(b.rankLabel).trim().slice(0, 80);
        }
        if (b.ratingAvg != null) {
            if (req.user.role !== "admin") {
                return res.status(403).json({ message: "Chỉ admin có thể chỉnh điểm đánh giá." });
            }
            const n = Number(b.ratingAvg);
            if (Number.isNaN(n) || n < 0 || n > 5) {
                return res.status(400).json({ message: "Đánh giá không hợp lệ." });
            }
            update["playerListing.ratingAvg"] = n;
        }
        if (b.reviewCount != null) {
            if (req.user.role !== "admin") {
                return res.status(403).json({ message: "Chỉ admin có thể chỉnh số review." });
            }
            update["playerListing.reviewCount"] = Math.max(0, Math.floor(Number(b.reviewCount) || 0));
        }
        if (b.voiceOk != null) {
            update["playerListing.voiceOk"] = Boolean(b.voiceOk);
        }
        if (b.isLive != null) {
            update["playerListing.isLive"] = Boolean(b.isLive);
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "Không có trường hợp lệ." });
        }

        const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select(
            "-hashedPassword"
        );

        return res.status(200).json({ user });
    } catch (error) {
        console.error("updatePlayerListing:", error);
        return res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

/** POST /api/user/provider-application — form đăng ký người cho thuê */
export const submitProviderApplication = async (req, res) => {
    try {
        const { pitch, primaryGameSlug, gender, proposedPricePerHour, skillImageUrls } = req.body ?? {};
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }
        const st = user.providerApplication?.status ?? "none";
        if (st === "pending") {
            return res.status(400).json({ message: "Đơn của bạn đang chờ admin duyệt." });
        }
        if (st === "approved") {
            return res.status(400).json({ message: "Bạn đã được duyệt làm người cho thuê." });
        }
        if (user.accountType === "provider") {
            return res.status(400).json({ message: "Tài khoản đang là người cho thuê." });
        }

        const slug = normalizeSlug(primaryGameSlug);
        if (!isAllowedSlug(slug)) {
            return res.status(400).json({ message: "Vui lòng chọn game đăng ký hợp lệ." });
        }

        const allowedGender = ["male", "female", "other", "prefer_not_say"];
        const g = typeof gender === "string" && allowedGender.includes(gender) ? gender : null;
        if (!g) {
            return res.status(400).json({ message: "Vui lòng chọn giới tính." });
        }

        const price = Number(proposedPricePerHour);
        if (Number.isNaN(price) || price < 10_000 || price > 50_000_000) {
            return res.status(400).json({ message: "Giá cho thuê từ 10.000 đến 50.000.000 ₫/giờ." });
        }

        const intro = pitch != null ? String(pitch).trim() : "";
        if (intro.length < 20) {
            return res.status(400).json({ message: "Giới thiệu tối thiểu 20 ký tự." });
        }
        if (intro.length > 800) {
            return res.status(400).json({ message: "Giới thiệu tối đa 800 ký tự." });
        }

        let urls = [];
        if (Array.isArray(skillImageUrls)) {
            urls = skillImageUrls
                .map((u) => String(u ?? "").trim().slice(0, MAX_URL))
                .filter(Boolean)
                .slice(0, 6);
        }
        if (urls.length < 1) {
            return res.status(400).json({ message: "Thêm ít nhất một URL ảnh kỹ năng (ảnh minh chứng)." });
        }

        user.providerApplication = user.providerApplication ?? {};
        user.providerApplication.status = "pending";
        user.providerApplication.pitch = intro.slice(0, 800);
        user.providerApplication.primaryGameSlug = slug;
        user.providerApplication.gender = g;
        user.providerApplication.proposedPricePerHour = Math.min(50_000_000, Math.floor(price));
        user.providerApplication.skillImageUrls = urls;
        user.providerApplication.appliedAt = new Date();
        await user.save();

        const out = await User.findById(user._id).select("-hashedPassword").lean();
        return res.status(200).json({ user: out });
    } catch (error) {
        console.error("submitProviderApplication:", error);
        return res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

const MAX_URL = 2000;

/**
 * PATCH /api/user/provider-studio — avatar, ảnh bìa, giá, game, rank, voice, live (chỉ provider).
 */
export const updateProviderStudio = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.accountType !== "provider") {
            return res.status(403).json({ message: "Chỉ người cho thuê (đã được duyệt) mới dùng Studio." });
        }

        const b = req.body ?? {};
        const update = {};

        if (b.avatarUrl !== undefined) {
            const s = String(b.avatarUrl).trim().slice(0, MAX_URL);
            update.avatarUrl = s || undefined;
        }
        if (b.listingCoverUrl !== undefined) {
            /* Ảnh bìa tự động theo game chính — bỏ qua URL tùy chỉnh từ client. */
        }
        if (b.pricePerHour != null) {
            const n = Number(b.pricePerHour);
            if (Number.isNaN(n) || n < 0) {
                return res.status(400).json({ message: "Giá không hợp lệ." });
            }
            update["playerListing.pricePerHour"] = Math.min(50_000_000, n);
        }
        if (b.rankLabel != null) {
            update["playerListing.rankLabel"] = String(b.rankLabel).trim().slice(0, 80);
        }
        if (b.voiceOk != null) {
            update["playerListing.voiceOk"] = Boolean(b.voiceOk);
        }
        if (b.isLive != null) {
            update["playerListing.isLive"] = Boolean(b.isLive);
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "Không có trường hợp lệ." });
        }

        const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select("-hashedPassword");

        await syncProviderFeaturedGame(req.user._id);
        const refreshed = await User.findById(req.user._id).select("-hashedPassword").lean();

        return res.status(200).json({ user: refreshed });
    } catch (error) {
        console.error("updateProviderStudio:", error);
        return res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

/**
 * PATCH /api/user/profile — tên hiển thị, bio, avatar URL (mọi user đã đăng nhập).
 * Body: { displayName?, bio?, avatarUrl? }
 */
export const updateProfile = async (req, res) => {
    try {
        const b = req.body ?? {};
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        let changed = false;
        if (b.displayName != null) {
            const d = String(b.displayName).trim();
            if (d.length < 2 || d.length > 80) {
                return res.status(400).json({ message: "Tên hiển thị từ 2 đến 80 ký tự." });
            }
            user.displayName = d;
            changed = true;
        }
        if (b.bio !== undefined) {
            const t = String(b.bio).trim().slice(0, 500);
            user.bio = t || undefined;
            changed = true;
        }
        if (b.avatarUrl !== undefined) {
            const s = String(b.avatarUrl).trim().slice(0, MAX_URL);
            user.avatarUrl = s || undefined;
            changed = true;
        }

        if (!changed) {
            return res.status(400).json({ message: "Gửi ít nhất một trường: displayName, bio hoặc avatarUrl." });
        }

        await user.save();
        const out = await User.findById(user._id).select("-hashedPassword").lean();
        return res.status(200).json({ user: out });
    } catch (error) {
        console.error("updateProfile:", error);
        return res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

/** POST /api/user/wallet/top-up { amountVnd } — demo nạp tiền. */
export const walletTopUp = async (req, res) => {
    try {
        const amount = Math.floor(Number(req.body?.amountVnd));
        if (!Number.isFinite(amount) || amount < 10_000 || amount > 50_000_000) {
            return res.status(400).json({ message: "Số tiền nạp từ 10.000 ₫ đến 50.000.000 ₫ mỗi lần (demo)." });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { walletBalanceVnd: amount, totalTopUpVnd: amount } },
            { new: true }
        ).select("-hashedPassword");

        return res.status(200).json({ user, creditedVnd: amount });
    } catch (error) {
        console.error("walletTopUp:", error);
        return res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};
