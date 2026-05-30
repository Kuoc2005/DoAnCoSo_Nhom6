/** Mỗi lớp có từ điển token → log P(w|c); điểm = sum log P(w|c) + log P(c).*/
import { ALLOWED_SLUGS, GAME_CATALOG, normalizeSlug } from "./gameTaxonomy.js";
const LABELS = ["find_match", "game_pick", "price_info", "leaderboard", "general"];
/** Log xác suất tiên nghiệm */
const LOG_PRIOR = Math.log(1 / LABELS.length);
/** Từ khóa rút gọn  */
const CLASS_KEYWORDS = {
    find_match: [
        "tìm",
        "bạn",
        "đồng",
        "đội",
        "ghép",
        "duo",
        "chơi",
        "cùng",
        "rank",
        "leo",
        "teammate",
        "party",
        "queue",
        "matchmaking",
        "suggestion",
        "gợi",
        "ý",
    ],
    game_pick: [
        "game",
        "chơi",
        "gì",
        "valorant",
        "lol",
        "liên",
        "minh",
        "pubg",
        "free",
        "fire",
        "genshin",
        "dota",
        "apex",
        "cs2",
        "fortnite",
        "tốc",
        "chiến",
    ],
    price_info: ["giá", "tiền", "thuê", "đồng", "vnd", "hour", "giờ", "bao", "nhiêu", "cost", "price"],
    leaderboard: ["xếp", "hạng", "top", "ranking", "leaderboard", "bảng", "điểm", "cao"],
    general: [],
};

function tokenize(text) {
    const s = String(text || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ");
    return s.split(/\s+/).filter(Boolean);
}

/** Xây map token → log-likelihood cho mỗi lớp (Laplace α=1). */
function buildLexicon() {
    const vocab = new Set();
    for (const lab of LABELS) {
        for (const w of CLASS_KEYWORDS[lab] || []) {
            vocab.add(w.toLowerCase());
        }
    }
    const V = vocab.size || 1;
    const alpha = 1;

    const logLikelihood = {};
    for (const lab of LABELS) {
        const words = [...(CLASS_KEYWORDS[lab] || [])].map((w) => w.toLowerCase());
        const counts = {};
        for (const w of words) counts[w] = (counts[w] ?? 0) + 1;
        const total = words.length + alpha * V;
        logLikelihood[lab] = {};
        for (const tok of vocab) {
            const c = counts[tok] ?? 0;
            logLikelihood[lab][tok] = Math.log((c + alpha) / total);
        }
        /** Laplace cho token OOV trong lớp này */
        logLikelihood[lab].__default = Math.log(alpha / total);
    }
    return { vocab, logLikelihood };
}

const LEX = buildLexicon();

export function classifyIntentUtterance(text) {
    const tokens = tokenize(text);
    const scores = {};
    for (const lab of LABELS) {
        let s = LOG_PRIOR;
        const ll = LEX.logLikelihood[lab];
        for (const t of tokens) {
            s += ll[t] ?? ll.__default;
        }
        scores[lab] = s;
    }

    /** Bonus khi slug game xuất hiện trong câu → game_pick */
    const slugHit = extractGameSlugFromText(text);
    if (slugHit) {
        scores.game_pick = (scores.game_pick ?? 0) + 2.5;
    }
    /** Bonus từ khóa tìm bạn */
    if (/\b(tìm|tim)\s+(bạn|ban|đồng|dong)\b/u.test(String(text || "").toLowerCase())) {
        scores.find_match = (scores.find_match ?? 0) + 2;
    }

    let best = LABELS[0];
    let max = -Infinity;
    for (const lab of LABELS) {
        if (scores[lab] > max) {
            max = scores[lab];
            best = lab;
        }
    }

    /** Chuẩn hoá thành xác suất mềm */
    const labs = LABELS;
    const exps = labs.map((l) => Math.exp(scores[l] - max));
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    const probs = {};
    labs.forEach((l, i) => {
        probs[l] = Math.round((exps[i] / sum) * 1000) / 1000;
    });

    return {
        label: best,
        scores,
        probs,
        extractedGameSlug: slugHit,
    };
}

export function extractGameSlugFromText(text) {
    const lower = String(text || "").toLowerCase();
    for (const slug of ALLOWED_SLUGS) {
        if (lower.includes(slug)) return slug;
        const label = GAME_CATALOG[slug]?.label?.toLowerCase() ?? "";
        if (label && lower.includes(label)) return slug;
    }
    /** alias thường gặp */
    if (/\bvalorant\b/i.test(text)) return "valorant";
    if (/\blol\b|\blmht\b|\blol\b/i.test(text)) return "lol";
    if (/\bpubg\b/i.test(text)) return "pubgm";
    if (/\bfree\s*fire\b|\bff\b/i.test(text)) return "freefire";
    return null;
}

export { LABELS };
