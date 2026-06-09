import User from "../models/user.js";
import { DEFAULT_WEIGHTS, maxHoursBySlug, normalizeMatchWeights, scoreUsers } from "../lib/matchEngine.js";
import { ALLOWED_SLUGS, GAME_CATALOG } from "../lib/gameTaxonomy.js";
import { classifyIntentUtterance, extractGameSlugFromText } from "../lib/intentClassifier.js";

function parseMinScorePercent(raw, fallback = 30) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(100, Math.max(0, n));
}

function parseWeightPercent(raw, fallback) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(100, Math.max(0, n));
}

function parseMatchWeightsFromQuery(query) {
    const hasCustom =
        query.wPref != null || query.wHist != null || query.wGenre != null;
    if (!hasCustom) return normalizeMatchWeights(DEFAULT_WEIGHTS);
    return normalizeMatchWeights({
        preference: parseWeightPercent(query.wPref, 45),
        playHistory: parseWeightPercent(query.wHist, 35),
        genreLayer: parseWeightPercent(query.wGenre, 20),
    });
}

export const getTaxonomy = (req, res) => {
    const games = ALLOWED_SLUGS.map((slug) => ({
        slug,
        label: GAME_CATALOG[slug].label,
        genres: GAME_CATALOG[slug].genres,
        coverUrl: GAME_CATALOG[slug].coverUrl ?? "",
    }));
    return res.json({ games });
};

export const getSuggestions = async (req, res) => {
    try {
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
        const minScorePercent = parseMinScorePercent(req.query.minScore);
        const weights = parseMatchWeightsFromQuery(req.query);
        const self = await User.findById(req.user._id).select(
            "gamingProfile displayName username email bio createdAt avatarUrl"
        );
        if (!self) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }
        const others = await User.find({ _id: { $ne: self._id } }).select(
            "gamingProfile displayName username email bio createdAt avatarUrl"
        );

        const pool = [self, ...others];
        const maxH = maxHoursBySlug(pool);
        const ranked = scoreUsers(self, others, maxH, weights)
            .filter((r) => r.scorePercent >= minScorePercent)
            .slice(0, limit);

        const suggestions = ranked.map((r) => ({
            score: r.score,
            scorePercent: r.scorePercent,
            explanation: {
                sharedFavoriteSlugs: r.explanation.sharedFavoriteSlugs,
                sharedHistorySlugs: r.explanation.sharedHistorySlugs,
                sharedGenres: r.explanation.sharedGenres,
                labels: r.explanation.labels,
            },
            user: {
                id: r.user._id,
                username: r.user.username,
                displayName: r.user.displayName,
                bio: r.user.bio,
                avatarUrl: r.user.avatarUrl ? String(r.user.avatarUrl).trim() : undefined,
                gamingProfile: r.user.gamingProfile,
                createdAt: r.user.createdAt,
            },
        }));

        return res.json({
            algorithm: "multi_label_vector_cosine",
            weights,
            minScorePercent,
            suggestions,
        });
    } catch (e) {
        console.error("getSuggestions:", e);
        return res.status(500).json({ message: "Không tạo được gợi ý." });
    }
};

/**
 * POST /api/match/assistant { message }
 * Phân lớp ý định (NB + softmax) + gợi ý ghép đội khi đăng nhập.
 */
export const postMatchAssistant = async (req, res) => {
    try {
        const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
        if (!message || message.length > 800) {
            return res.status(400).json({ message: "Tin nhắn quá ngắn hoặc quá dài." });
        }

        const classified = classifyIntentUtterance(message);
        const slugFromText = classified.extractedGameSlug ?? extractGameSlugFromText(message);

        let reply =
            "Mình có thể giúp bạn tìm đồng đội phù hợp. Hãy thử mô tả game hoặc rank mong muốn, và cập nhật **Hồ sơ game** để thuật toán ghép vector có dữ liệu.";

        if (classified.label === "leaderboard") {
            reply =
                "Bảng **Xếp hạng** gồm: nạp tiền nhiều nhất, thuê (chi tiêu) nhiều nhất, và người cho thuê kiếm nhiều nhất từ booking.";
        } else if (classified.label === "price_info") {
            reply =
                "Giá thuê theo giờ được người chơi tự đặt trên hồ sơ. Vào **Khám phá** hoặc trang công khai `/players/<username>` để xem chi tiết và liên hệ.";
        } else if (classified.label === "game_pick" && slugFromText && GAME_CATALOG[slugFromText]) {
            const lab = GAME_CATALOG[slugFromText].label;
            reply = `Bạn đang quan tâm **${lab}**. Vào **Khám phá** và lọc theo game này để xem người cho thuê phù hợp.`;
        } else if (classified.label === "find_match") {
            reply =
                "Để ghép đồng đội, hệ thống dùng vector đa nhãn (game + thể loại) và cosine similarity giữa bạn và các người chơi khác. Hãy thêm game yêu thích và lịch sử giờ chơi trong **Hồ sơ → Gaming**.";
        }

        let suggestions = [];
        if (req.user) {
            const self = await User.findById(req.user._id).select(
                "gamingProfile displayName username email bio createdAt avatarUrl"
            );
            if (self) {
                let others = await User.find({ _id: { $ne: self._id } }).select(
                    "gamingProfile displayName username email bio createdAt avatarUrl"
                );
                if (slugFromText && ALLOWED_SLUGS.includes(slugFromText)) {
                    others = others.filter((u) => {
                        const fav = u.gamingProfile?.favoriteSlugs ?? [];
                        const hist = u.gamingProfile?.playHistory ?? [];
                        return (
                            fav.map((s) => String(s).toLowerCase()).includes(slugFromText) ||
                            hist.some((h) => String(h.gameSlug).toLowerCase() === slugFromText)
                        );
                    });
                    if (others.length === 0) {
                        others = await User.find({ _id: { $ne: self._id } }).select(
                            "gamingProfile displayName username email bio createdAt avatarUrl"
                        );
                    }
                }
                const pool = [self, ...others];
                const maxH = maxHoursBySlug(pool);
                const ranked = scoreUsers(self, others, maxH)
                    .filter((r) => r.scorePercent >= 30)
                    .slice(0, 5);
                suggestions = ranked.map((r) => ({
                    scorePercent: r.scorePercent,
                    username: r.user.username,
                    displayName: r.user.displayName,
                }));
                if (classified.label === "find_match" || classified.label === "game_pick") {
                    const names = suggestions.slice(0, 3).map((s) => `@${s.username}`);
                    if (names.length) {
                        reply += ` Gợi ý nhanh theo thuật toán ghép: ${names.join(", ")}.`;
                    }
                }
            }
        } else if (classified.label === "find_match" || classified.label === "game_pick") {
            reply += " Đăng nhập để xem **gợi ý được cá nhân hoá** theo hồ sơ của bạn.";
        }

        return res.json({
            algorithm: "naive_bayes_token_likelihood + softmax",
            intent: classified.label,
            intentProbs: classified.probs,
            extractedGameSlug: slugFromText,
            reply,
            suggestions,
        });
    } catch (e) {
        console.error("postMatchAssistant:", e);
        return res.status(500).json({ message: "Trợ lý không phản hồi được." });
    }
};
