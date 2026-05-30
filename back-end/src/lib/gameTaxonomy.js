export const GENRES = ["FPS", "MOBA", "BR", "TacShooter", "RPG", "Casual"];

/** slug -> { label, genres[], coverUrl } — ảnh bìa mặc định theo game */
export const GAME_CATALOG = Object.freeze({
    valorant: {
        label: "Valorant",
        genres: ["FPS", "TacShooter"],
        coverUrl: "https://cdn.tgdd.vn/2020/05/content/bo-hinh-nen-valorant-dep-mat-cho-may-tinh-dien-thoai-game-thu-khong-nen-bo-qua-1-800x450-1.jpg",
    },
    lol: {
        label: "Liên Minh Huyền Thoại",
        genres: ["MOBA"],
        coverUrl: "https://cellphones.com.vn/sforum/wp-content/uploads/2024/02/lmht-dau-la-nhung-vi-tuong-thuong-xuyen-duoc-su-dung-trong-che-do-xep-hang.jpg",
    },
    lolwr: {
        label: "Tốc Chiến",
        genres: ["MOBA"],
        coverUrl: "https://thuthuatnhanh.com/wp-content/uploads/2021/07/hinh-nen-lien-minh-toc-chien-moi-nhat.jpg",
    },
    pubgm: {
        label: "PUBG Mobile",
        genres: ["BR"],
        coverUrl: "https://i.pinimg.com/736x/22/dd/9b/22dd9bc9ec3d5d68cf7a13eb5605b907.jpg",
    },
    freefire: {
        label: "Free Fire",
        genres: ["BR", "Casual"],
        coverUrl: "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2024/02/avatar-ff-ngau-thumb.jpg",
    },
    cs2: {
        label: "Counter-Strike 2",
        genres: ["FPS", "TacShooter"],
        coverUrl: "https://cdn.tgdd.vn/Files/2023/03/23/1519826/cs2_new_-230323-081437-800-resize.jpg",
    },
    apex: {
        label: "Apex Legends",
        genres: ["BR", "FPS"],
        coverUrl: "https://cdn.tgdd.vn/News/0/5-1280x720-61.jpg",
    },
    genshin: {
        label: "Genshin Impact",
        genres: ["RPG"],
        coverUrl: "https://cdn.tgdd.vn//GameApp/-1//thumb-800x450-6.jpg",
    },
    dota2: {
        label: "Dota 2",
        genres: ["MOBA"],
        coverUrl: "https://cdn.tgdd.vn/2020/06/campaign/hinh-nen-dota-2-full-hd-cho-may-tinh-va-dien-thoai-thumb-640x360.jpg",
    },
    fortnite: {
        label: "Fortnite",
        genres: ["BR", "Casual"],
        coverUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJUHLLnFG1Eq23l_A92DWjVqbQboADsylBpw&s",
    },
});

export const ALLOWED_SLUGS = Object.keys(GAME_CATALOG);

export function normalizeSlug(s) {
    return String(s || "")
        .trim()
        .toLowerCase();
}

export function isAllowedSlug(slug) {
    return ALLOWED_SLUGS.includes(normalizeSlug(slug));
}

export function genresForSlug(slug) {
    const key = normalizeSlug(slug);
    return GAME_CATALOG[key]?.genres ?? [];
}

/** Ảnh bìa mặc định theo slug game (dùng cho hồ sơ provider). */
export function coverUrlForSlug(slug) {
    const key = normalizeSlug(slug);
    if (!isAllowedSlug(key)) return "";
    return GAME_CATALOG[key]?.coverUrl ?? "";
}
