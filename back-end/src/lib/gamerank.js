import { normalizeSlug } from "./gameTaxonomy.js";

const RANK_LEVELS = {
    valorant: [
        "iron",
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "ascendant",
        "immortal",
        "radiant"
    ],

    lol: [
        "iron",
        "bronze",
        "silver",
        "gold",
        "platinum",
        "emerald",
        "diamond",
        "master",
        "grandmaster",
        "challenger"
    ],

    lolwr: [
        "iron",
        "bronze",
        "silver",
        "gold",
        "platinum",
        "emerald",
        "diamond",
        "master",
        "grandmaster",
        "challenger"
    ],

    pubgm: [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "crown",
        "ace",
        "ace-master",
        "ace-dominator",
        "conqueror"
    ],

    freefire: [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "heroic",
        "master",
        "grandmaster"
    ],

    cs2: [
        "silver",
        "gold-nova",
        "master-guardian",
        "distinguished-master-guardian",
        "legendary-eagle",
        "legendary-eagle-master",
        "supreme-master-first-class",
        "global-elite"
    ],

    apex: [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "master",
        "predator"
    ],

    genshin: [],

    dota2: [
        "herald",
        "guardian",
        "crusader",
        "archon",
        "legend",
        "ancient",
        "divine",
        "immortal"
    ],

    fortnite: [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "elite",
        "champion",
        "unreal"
    ]
};

export function normalizeRank(rank) {
    return String(rank ?? "")
        .trim()
        .toLowerCase();
}

export function getRankLevels(gameSlug) {
    const slug = normalizeSlug(gameSlug);
    return RANK_LEVELS[slug] ?? [];
}

export function getRankLevel(gameSlug, rankLabel) {
    const levels = getRankLevels(gameSlug);
    const rank = normalizeRank(rankLabel);

    if (!levels.length || !rank) {
        return -1;
    }

    return levels.indexOf(rank);
}

export function isValidRankLabel(gameSlug, rankLabel) {
    return getRankLevel(gameSlug, rankLabel) >= 0;
}

/** Chuẩn hoá rankLabel về slug trong bảng rank của game (hoặc "" nếu không hợp lệ). */
export function normalizeRankLabelForGame(gameSlug, rankLabel) {
    const levels = getRankLevels(gameSlug);
    const rank = normalizeRank(rankLabel);
    if (!levels.length || !rank || !levels.includes(rank)) {
        return "";
    }
    return rank;
}

export function getUserRankForGame(user, gameSlug) {
    const slug = normalizeSlug(gameSlug);

    const ranks = user?.playerListing?.ranks ?? [];

    const found = ranks.find(
        item => normalizeSlug(item?.gameSlug) === slug
    );

    return found?.rankLabel ?? "";
}

export function rankSimilarity(gameSlug, rankA, rankB) {
    const levels = getRankLevels(gameSlug);

    if (levels.length <= 1) {
        return 0;
    }

    const levelA = getRankLevel(gameSlug, rankA);
    const levelB = getRankLevel(gameSlug, rankB);

    if (levelA < 0 || levelB < 0) {
        return 0;
    }

    return 1 - Math.abs(levelA - levelB) / (levels.length - 1);
}