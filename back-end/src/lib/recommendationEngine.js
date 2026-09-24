import { normalizeSlug } from "./gameTaxonomy.js";
import {
    getUserRankForGame,
    rankSimilarity
} from "./gamerank.js";
/**
 * Giới hạn giá trị trong khoảng min -> max
 */
function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
}

/**
 * =========================================================
 * 1. MỨC ĐỘ TRÙNG GAME YÊU THÍCH
 * =========================================================
 *
 * So sánh danh sách favoriteSlugs của 2 người.
 *
 * Ví dụ:
 * A: [minecraft, valorant, fifa]
 * B: [minecraft, valorant]
 *
 * shared = 2
 * max = 3
 *
 * score = 2 / 3 = 0.67
 */
function favoriteGameScore(userA, userB) {
    const favA = new Set(
        (userA.gamingProfile?.favoriteSlugs ?? [])
            .map(normalizeSlug)
            .filter(Boolean)
    );

    const favB = new Set(
        (userB.gamingProfile?.favoriteSlugs ?? [])
            .map(normalizeSlug)
            .filter(Boolean)
    );

    if (favA.size === 0 || favB.size === 0) {
        return 0;
    }

    let shared = 0;

    for (const game of favA) {
        if (favB.has(game)) {
            shared++;
        }
    }

    return clamp(
        shared / Math.max(favA.size, favB.size)
    );
}


/**
 * =========================================================
 * 2. MỨC ĐỘ TƯƠNG ĐỒNG LỊCH SỬ CHƠI
 * =========================================================
 *
 * So sánh số giờ chơi các game mà 2 người từng chơi.
 *
 * Ví dụ:
 * A chơi Valorant 100 giờ
 * B chơi Valorant 80 giờ
 *
 * score = 80 / 100 = 0.8
 */
function playHistoryScore(userA, userB) {

    const historyA = new Map();

    for (const row of userA.gamingProfile?.playHistory ?? []) {

        const slug = normalizeSlug(row.gameSlug);

        if (!slug) continue;

        const hours = Number(row.hoursPlayed) || 0;

        historyA.set(
            slug,
            (historyA.get(slug) ?? 0) + hours
        );
    }


    const historyB = new Map();

    for (const row of userB.gamingProfile?.playHistory ?? []) {

        const slug = normalizeSlug(row.gameSlug);

        if (!slug) continue;

        const hours = Number(row.hoursPlayed) || 0;

        historyB.set(
            slug,
            (historyB.get(slug) ?? 0) + hours
        );
    }


    const commonGames = [...historyA.keys()]
        .filter(game => historyB.has(game));


    if (commonGames.length === 0) {
        return 0;
    }


    let total = 0;

    for (const game of commonGames) {

        const hoursA =
            historyA.get(game) ?? 0;

        const hoursB =
            historyB.get(game) ?? 0;

        const maxHours =
            Math.max(hoursA, hoursB);

        const minHours =
            Math.min(hoursA, hoursB);


        if (maxHours > 0) {

            total +=
                minHours / maxHours;
        }
    }


    return clamp(
        total / commonGames.length
    );
}


/**
 * =========================================================
 * 3. MỨC ĐỘ HOẠT ĐỘNG CỦA USER
 * =========================================================
 *
 * Dùng cho cả 2 user.
 *
 * <= 1 ngày  : 1.0
 * <= 7 ngày  : 0.8
 * <= 30 ngày : 0.5
 * <= 90 ngày : 0.2
 * > 90 ngày  : 0
 */
function activityScore(user) {

    const history =
        user.gamingProfile?.playHistory ?? [];


    if (history.length === 0) {
        return 0;
    }


    const now = Date.now();

    let bestScore = 0;


    for (const row of history) {

        if (!row.lastPlayedAt) {
            continue;
        }


        const lastPlayed =
            new Date(row.lastPlayedAt).getTime();


        if (Number.isNaN(lastPlayed)) {
            continue;
        }


        const days =
            (now - lastPlayed) /
            (1000 * 60 * 60 * 24);


        let score = 0;


        if (days <= 1) {

            score = 1;

        } else if (days <= 7) {

            score = 0.8;

        } else if (days <= 30) {

            score = 0.5;

        } else if (days <= 90) {

            score = 0.2;

        } else {

            score = 0;
        }


        bestScore =
            Math.max(bestScore, score);
    }


    return bestScore;
}


/**
 * =========================================================
 * 4. MỨC ĐỘ CHƠI DỰA TRÊN SESSION
 * =========================================================
 *
 * 50 session trở lên = mức hoạt động cao nhất.
 */
function sessionScore(user) {

    const history =
        user.gamingProfile?.playHistory ?? [];


    if (history.length === 0) {
        return 0;
    }


    const totalSessions =
        history.reduce(
            (sum, row) =>
                sum +
                (Number(row.sessionsCount) || 0),
            0
        );


    return clamp(
        totalSessions / 50
    );
}


/**
 * =========================================================
 * 5. TƯƠNG THÍCH VỀ MỨC ĐỘ HOẠT ĐỘNG
 * =========================================================
 *
 * Không lấy activity của B trực tiếp.
 *
 * Thay vào đó:
 *
 * compatibility =
 * 1 - |activityA - activityB|
 *
 * Nếu:
 *
 * A = 1
 * B = 1
 *
 * => 1 - |1 - 1| = 1
 *
 *
 * Nếu:
 *
 * A = 1
 * B = 0
 *
 * => 1 - |1 - 0| = 0
 */
function activityCompatibility(userA, userB) {

    const activityA =
        activityScore(userA);

    const activityB =
        activityScore(userB);


    return clamp(
        1 - Math.abs(
            activityA - activityB
        )
    );
}


/**
 * =========================================================
 * 6. TƯƠNG THÍCH VỀ SỐ SESSION
 * =========================================================
 */
function sessionCompatibility(userA, userB) {

    const sessionsA =
        sessionScore(userA);

    const sessionsB =
        sessionScore(userB);


    return clamp(
        1 - Math.abs(
            sessionsA - sessionsB
        )
    );
}
/**
 * Map gameSlug -> rankLabel từ playerListing.ranks
 */
function rankByGameMap(user) {
    const map = new Map();
    for (const row of user?.playerListing?.ranks ?? []) {
        const slug = normalizeSlug(row?.gameSlug);
        const label = String(row?.rankLabel ?? "").trim();
        if (!slug || !label) continue;
        map.set(slug, label);
    }
    return map;
}

/**
 * =========================================================
 * 7. TƯƠNG ĐỒNG VỀ RANK
 * =========================================================
 *
 * Chỉ so sánh rank khi hai user cùng khai báo rank cho cùng một game.
 * Không so rank giữa hai game khác nhau. Không có cặp game chung có rank => 0.
 */
function rankScore(userA, userB) {
    const mapA = rankByGameMap(userA);
    const mapB = rankByGameMap(userB);

    if (mapA.size === 0 || mapB.size === 0) {
        return 0;
    }

    let total = 0;
    let count = 0;

    for (const game of mapA.keys()) {
        if (!mapB.has(game)) continue;

        const rankA = getUserRankForGame(userA, game);
        const rankB = getUserRankForGame(userB, game);

        if (!rankA || !rankB) {
            continue;
        }

        total += rankSimilarity(game, rankA, rankB);
        count++;
    }

    if (count === 0) {
        return 0;
    }

    return clamp(total / count);
}

/**
 * =========================================================
 * 8. TÍNH ĐIỂM RECOMMENDATION
 * =========================================================
 */
export function calculateRecommendationScore(
    userA,
    userB
) {

    const favorite =
        favoriteGameScore(
            userA,
            userB
        );


    const history =
        playHistoryScore(
            userA,
            userB
        );


    const rank =
        rankScore(
            userA,
            userB
        );


    const activity =
        activityCompatibility(
            userA,
            userB
        );


    const sessions =
        sessionCompatibility(
            userA,
            userB
        );


    const score =
        favorite * 0.30 +
        history * 0.25 +
        rank * 0.25 +
        activity * 0.10 +
        sessions * 0.10;


    return {

        score,

        scorePercent:
            Math.round(
                score * 1000
            ) / 10,

        breakdown: {

            favorite:
                Math.round(
                    favorite * 1000
                ) / 10,

            history:
                Math.round(
                    history * 1000
                ) / 10,

            rank:
                Math.round(
                    rank * 1000
                ) / 10,

            activity:
                Math.round(
                    activity * 1000
                ) / 10,

            sessions:
                Math.round(
                    sessions * 1000
                ) / 10
        }
    };
}

/**
 * =========================================================
 * 9. GIẢI THÍCH TẠI SAO ĐƯỢC ĐỀ XUẤT
 * =========================================================
 */
export function explainRecommendation(
    userA,
    userB
) {

    const reasons = [];


    /**
     * -------------------------
     * GAME YÊU THÍCH CHUNG
     * -------------------------
     */

    const favA = new Set(
        (userA.gamingProfile?.favoriteSlugs ?? [])
            .map(normalizeSlug)
            .filter(Boolean)
    );


    const favB = new Set(
        (userB.gamingProfile?.favoriteSlugs ?? [])
            .map(normalizeSlug)
            .filter(Boolean)
    );


    const sharedGames =
        [...favA].filter(
            game => favB.has(game)
        );


    if (sharedGames.length > 0) {

        reasons.push(
            `Cùng yêu thích ${sharedGames.length} game`
        );
    }


    /**
     * -------------------------
     * GAME TỪNG CHƠI CHUNG
     * -------------------------
     */

    const historyA = new Set(
        (userA.gamingProfile?.playHistory ?? [])
            .map(row =>
                normalizeSlug(row.gameSlug)
            )
            .filter(Boolean)
    );


    const historyB = new Set(
        (userB.gamingProfile?.playHistory ?? [])
            .map(row =>
                normalizeSlug(row.gameSlug)
            )
            .filter(Boolean)
    );


    const sharedHistory =
        [...historyA].filter(
            game => historyB.has(game)
        );


    if (sharedHistory.length > 0) {

        reasons.push(
            `Có ${sharedHistory.length} game từng chơi chung`
        );
    }
    /**
     * -------------------------
     * RANK TƯƠNG ĐỒNG
     * -------------------------
     */

    const rankMapA = rankByGameMap(userA);
    const rankMapB = rankByGameMap(userB);

    for (const game of rankMapA.keys()) {
        if (!rankMapB.has(game)) continue;

        const rankA = getUserRankForGame(userA, game);
        const rankB = getUserRankForGame(userB, game);

        if (!rankA || !rankB) continue;

        const rank = rankSimilarity(game, rankA, rankB);

        if (rank >= 0.75) {
            reasons.push(`Rank tương đồng ${game} (${rankA} - ${rankB})`);
        } else if (rank >= 0.5) {
            reasons.push(`Rank khá gần nhau ${game} (${rankA} - ${rankB})`);
        }
    }

    /**
     * -------------------------
     * HOẠT ĐỘNG TƯƠNG ĐỒNG
     * -------------------------
     */

    const activityA =
        activityScore(userA);

    const activityB =
        activityScore(userB);


    const activityDifference =
        Math.abs(
            activityA - activityB
        );


    if (activityDifference <= 0.2) {

        reasons.push(
            "Có mức độ hoạt động tương đồng"
        );
    }


    /**
     * -------------------------
     * SESSION TƯƠNG ĐỒNG
     * -------------------------
     */

    const sessionsA =
        sessionScore(userA);

    const sessionsB =
        sessionScore(userB);


    const sessionDifference =
        Math.abs(
            sessionsA - sessionsB
        );


    if (sessionDifference <= 0.2) {

        reasons.push(
            "Có tần suất chơi tương đồng"
        );
    }


    return {

        sharedFavoriteGames:
            sharedGames,

        sharedHistoryGames:
            sharedHistory,

        reasons
    };
}


/**
 * =========================================================
 * 9. RECOMMEND TEAMMATES
 * =========================================================
 */
export function recommendTeammates(
    user,
    candidates,
    limit = 10
) {

    const results = [];


    for (const candidate of candidates) {

        /**
         * Không đề xuất chính bản thân
         */
        if (
            String(candidate._id) ===
            String(user._id)
        ) {
            continue;
        }


        /**
         * Tính điểm
         */
        const result =
            calculateRecommendationScore(
                user,
                candidate
            );


        /**
         * Sinh lý do
         */
        const explanation =
            explainRecommendation(
                user,
                candidate
            );


        results.push({

            user: candidate,

            score:
                result.score,

            scorePercent:
                result.scorePercent,

            breakdown:
                result.breakdown,

            explanation
        });
    }


    /**
     * Sắp xếp điểm cao -> thấp
     */
    results.sort(
        (a, b) =>
            b.score - a.score
    );


    /**
     * Giới hạn số lượng
     */
    return results.slice(
        0,
        limit
    );
}