/**
 * Seed 20 người cho thuê — 2 người / game (10 game).
 * Chạy: npm run seed:providers
 */
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/user.js";
import { ALLOWED_SLUGS, GAME_CATALOG, coverUrlForSlug } from "../lib/gameTaxonomy.js";
import { syncAllProvidersFeaturedGame } from "../lib/providerGameProfile.js";

dotenv.config();

const SEED_PASSWORD = process.env.SEED_PROVIDER_PASSWORD?.trim() || "Provider123";

const RANKS_BY_GAME = {
    valorant: ["Immortal 1", "Diamond 3"],
    lol: ["Kim Cương II", "Bạch Kim I"],
    lolwr: ["Thách Đấu", "Kim Cương IV"],
    pubgm: ["Conqueror", "Ace Dominator"],
    freefire: ["Heroic", "Grandmaster"],
    cs2: ["Global Elite", "Supreme"],
    apex: ["Master", "Diamond II"],
    genshin: ["AR 60", "AR 58"],
    dota2: ["Ancient V", "Legend III"],
    fortnite: ["Unreal", "Champion"],
};

const DISPLAY_NAMES = {
    valorant: ["Minh Valo", "Lan Tac"],
    lol: ["Hoàng LMHT", "Chi MOBA"],
    lolwr: ["Tùng Tốc Chiến", "Vy Wild"],
    pubgm: ["Khoa PUBG", "Hà Sniper"],
    freefire: ["Đạt FF", "Ngọc Rush"],
    cs2: ["Phú CS", "Trang Aim"],
    apex: ["Bình Apex", "My Frag"],
    genshin: ["An Genshin", "Thảo Co-op"],
    dota2: ["Quân Dota", "Hương Support"],
    fortnite: ["Long Build", "Mai Edit"],
};

function avatarUrl(seed) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function buildProviders() {
    const rows = [];
    for (const slug of ALLOWED_SLUGS) {
        const label = GAME_CATALOG[slug]?.label ?? slug;
        const ranks = RANKS_BY_GAME[slug] ?? ["Pro", "Semi-pro"];
        const names = DISPLAY_NAMES[slug] ?? [`Duo ${slug} 1`, `Duo ${slug} 2`];
        for (let i = 0; i < 2; i++) {
            const n = i + 1;
            rows.push({
                username: `duo_${slug}_${n}`,
                email: `duo.${slug}.${n}@playerduo.demo`,
                displayName: names[i] ?? `${label} Duo ${n}`,
                slug,
                rankLabel: ranks[i] ?? ranks[0],
                pricePerHour: 45000 + n * 8000 + ALLOWED_SLUGS.indexOf(slug) * 1500,
                ratingAvg: 4.2 + (i * 0.35) + (ALLOWED_SLUGS.indexOf(slug) % 3) * 0.1,
                reviewCount: 12 + i * 9 + ALLOWED_SLUGS.indexOf(slug) * 3,
                isLive: i === 0,
            });
        }
    }
    return rows;
}

async function seed() {
    if (!process.env.MONGODB_CONNECTION_STRING) {
        console.error("Thiếu MONGODB_CONNECTION_STRING trong .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
    const providers = buildProviders();
    let created = 0;
    let updated = 0;

    for (const p of providers) {
        const cover = coverUrlForSlug(p.slug);
        const doc = {
            username: p.username,
            email: p.email,
            hashedPassword,
            displayName: p.displayName,
            role: "user",
            accountType: "provider",
            bio: `Người cho thuê ${GAME_CATALOG[p.slug]?.label ?? p.slug} — rank ${p.rankLabel}. Sẵn sàng duo, voice, chill hoặc tryhard.`,
            avatarUrl: avatarUrl(p.username),
            walletBalanceVnd: 500_000,
            providerApplication: {
                status: "approved",
                pitch: `Chuyên ${GAME_CATALOG[p.slug]?.label ?? p.slug}, kinh nghiệm nhiều mùa ranked.`,
                appliedAt: new Date(),
                primaryGameSlug: p.slug,
                gender: p.username.endsWith("_1") ? "male" : "female",
                proposedPricePerHour: p.pricePerHour,
                skillImageUrls: [cover].filter(Boolean),
            },
            playerListing: {
                pricePerHour: p.pricePerHour,
                rankLabel: p.rankLabel,
                primaryGameSlug: p.slug,
                featuredGameSlug: p.slug,
                ratingAvg: Math.min(5, Math.round(p.ratingAvg * 10) / 10),
                reviewCount: p.reviewCount,
                voiceOk: true,
                isLive: p.isLive,
                isVerifiedProvider: true,
                listingCoverUrl: cover,
            },
            gamingProfile: {
                favoriteSlugs: [p.slug],
                playHistory: [
                    {
                        gameSlug: p.slug,
                        hoursPlayed: 800 + p.reviewCount * 12,
                        sessionsCount: 200 + p.reviewCount,
                        lastPlayedAt: new Date(),
                    },
                ],
            },
        };

        const existing = await User.findOne({ username: p.username }).select("_id").lean();
        await User.findOneAndUpdate({ username: p.username }, { $set: doc }, { upsert: true });
        if (existing) updated += 1;
        else created += 1;
    }

    console.log(`[seed] Xong: ${providers.length} provider (${ALLOWED_SLUGS.length} game × 2).`);
    console.log(`[seed] Tạo mới: ${created}, cập nhật: ${updated}.`);
    console.log(`[seed] Mật khẩu đăng nhập (tất cả): ${SEED_PASSWORD}`);
    console.log(`[seed] Username mẫu: duo_valorant_1, duo_lol_2, … (xem /explore)`);
    const synced = await syncAllProvidersFeaturedGame();
    console.log(`[seed] Đã đồng bộ featuredGameSlug cho ${synced} provider.`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error("[seed] Lỗi:", err);
    process.exit(1);
});
