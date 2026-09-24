import User from "../models/user.js";
import { ALLOWED_SLUGS, GAME_CATALOG } from "../lib/gameTaxonomy.js";
import { hubProviderAccountQuery, mapUserToListingPayload } from "../lib/listingMappers.js";
import { gameFilterOrClause } from "../lib/providerGameProfile.js";

export async function getHomeCatalog(req, res) {
    try {
        const totalPlayers = await User.countDocuments(hubProviderAccountQuery());

        const categories = [];
        for (const slug of ALLOWED_SLUGS) {
            const playerCount = await User.countDocuments({
                $and: [hubProviderAccountQuery(), gameFilterOrClause(slug)],
            });
            categories.push({
                slug,
                label: GAME_CATALOG[slug].label,
                playerCount,
            });
        }
        categories.sort((a, b) => b.playerCount - a.playerCount);

        const featuredDocs = await User.find(hubProviderAccountQuery())
            .sort({ "playerListing.ratingAvg": -1, createdAt: -1 })
            .limit(8)
            .lean();

        const featuredPlayers = featuredDocs.map(mapUserToListingPayload);

        const hotGames = categories.slice(0, 8).map((c) => ({
            ...c,
            gradientKey: c.slug,
        }));

        return res.json({
            stats: { totalPlayers },
            categories,
            featuredPlayers,
            hotGames,
        });
    } catch (e) {
        console.error("getHomeCatalog:", e);
        return res.status(500).json({ message: "Không tải được dữ liệu trang chủ." });
    }
}
