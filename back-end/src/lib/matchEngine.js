/**
 * Engine gợi ý đồng đội:
 * - Xây vector đa nhãn trên tập game (sở thích + giờ chơi chuẩn hoá).
 * - Cộng thêm khối thể loại (genre) — coi như lớp phụ trong không gian đặc trưng.
 * - Điểm ghép: cosine similarity (tương đương độ gần hướng sở thích).
 */
import { ALLOWED_SLUGS, GAME_CATALOG, GENRES, genresForSlug, normalizeSlug } from "./gameTaxonomy.js";

const W_PREF = 0.45;
const W_HIST = 0.35;
const W_GENRE = 0.2;

function l2Normalize(vec) {
    let s = 0;
    for (let i = 0; i < vec.length; i++) s += vec[i] * vec[i];
    const n = Math.sqrt(s) || 1;
    return vec.map((x) => x / n);
}

/**
 * Chuẩn hoá giờ chơi theo max toàn corpus (theo từng game).
 */
export function maxHoursBySlug(users) {
    const maxH = {};
    for (const u of users) {
        const ph = u.gamingProfile?.playHistory ?? [];
        for (const row of ph) {
            const slug = normalizeSlug(row.gameSlug);
            if (!ALLOWED_SLUGS.includes(slug)) continue;
            const h = Number(row.hoursPlayed) || 0;
            maxH[slug] = Math.max(maxH[slug] ?? 0, h);
        }
    }
    for (const slug of ALLOWED_SLUGS) {
        if (maxH[slug] == null || maxH[slug] < 1) maxH[slug] = 1;
    }
    return maxH;
}

/**
 * Vector độ dài cố định: |ALLOWED_SLUGS| (game) + |GENRES|
 */
export function buildUserVector(user, maxHours) {
    const dimGames = ALLOWED_SLUGS.length;
    const dimGenres = GENRES.length;
    const vec = new Array(dimGames + dimGenres).fill(0);

    const fav = new Set((user.gamingProfile?.favoriteSlugs ?? []).map(normalizeSlug).filter((s) => ALLOWED_SLUGS.includes(s)));

    const histMap = new Map();
    for (const row of user.gamingProfile?.playHistory ?? []) {
        const slug = normalizeSlug(row.gameSlug);
        if (!ALLOWED_SLUGS.includes(slug)) continue;
        const prev = histMap.get(slug) ?? 0;
        histMap.set(slug, prev + (Number(row.hoursPlayed) || 0));
    }

    for (let i = 0; i < dimGames; i++) {
        const slug = ALLOWED_SLUGS[i];
        const pref = fav.has(slug) ? 1 : 0;
        const raw = histMap.get(slug) ?? 0;
        const mx = maxHours[slug] ?? 1;
        const hist = raw > 0 ? Math.min(1, raw / mx) : 0;
        vec[i] = W_PREF * pref + W_HIST * hist;
    }

    // Genre pool: trung bình các chiều game thuộc genre (đã có trọng số pref+hist)
    for (let g = 0; g < dimGenres; g++) {
        const genre = GENRES[g];
        let sum = 0;
        let cnt = 0;
        for (let i = 0; i < dimGames; i++) {
            const slug = ALLOWED_SLUGS[i];
            if (genresForSlug(slug).includes(genre)) {
                sum += vec[i];
                cnt++;
            }
        }
        vec[dimGames + g] = cnt ? (sum / cnt) * W_GENRE : 0;
    }

    return l2Normalize(vec);
}

export function cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
}

/**
 *  game trùng sở thích / trùng lịch sử.
 */
export function explainMatch(selfUser, otherUser) {
    const favA = new Set((selfUser.gamingProfile?.favoriteSlugs ?? []).map(normalizeSlug));
    const favB = new Set((otherUser.gamingProfile?.favoriteSlugs ?? []).map(normalizeSlug));
    const sharedFav = [...favA].filter((s) => ALLOWED_SLUGS.includes(s) && favB.has(s));

    const histA = new Map();
    for (const row of selfUser.gamingProfile?.playHistory ?? []) {
        const slug = normalizeSlug(row.gameSlug);
        if (!ALLOWED_SLUGS.includes(slug)) continue;
        histA.set(slug, (histA.get(slug) ?? 0) + (Number(row.hoursPlayed) || 0));
    }
    const histB = new Map();
    for (const row of otherUser.gamingProfile?.playHistory ?? []) {
        const slug = normalizeSlug(row.gameSlug);
        if (!ALLOWED_SLUGS.includes(slug)) continue;
        histB.set(slug, (histB.get(slug) ?? 0) + (Number(row.hoursPlayed) || 0));
    }
    const sharedHist = ALLOWED_SLUGS.filter((slug) => (histA.get(slug) ?? 0) > 0 && (histB.get(slug) ?? 0) > 0);

    const genreA = new Set();
    favA.forEach((slug) => genresForSlug(slug).forEach((g) => genreA.add(g)));
    const genreB = new Set();
    favB.forEach((slug) => genresForSlug(slug).forEach((g) => genreB.add(g)));
    const sharedGenres = [...genreA].filter((g) => genreB.has(g));

    return {
        sharedFavoriteSlugs: sharedFav,
        sharedHistorySlugs: sharedHist,
        sharedGenres,
        labels: sharedFav.map((s) => GAME_CATALOG[s]?.label ?? s),
    };
}

export function scoreUsers(selfUser, candidates, maxHours) {
    const selfVec = buildUserVector(selfUser, maxHours);
    const out = [];
    for (const u of candidates) {
        if (String(u._id) === String(selfUser._id)) continue;
        const v = buildUserVector(u, maxHours);
        let score = cosineSimilarity(selfVec, v);
        if (Number.isNaN(score)) score = 0;
        const explanation = explainMatch(selfUser, u);
        out.push({
            user: u,
            score,
            scorePercent: Math.round(score * 1000) / 10,
            explanation,
        });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
}
