import mongoose from "mongoose";
import User from "../models/user.js";
import Booking from "../models/booking.js";
import { isAllowedSlug, normalizeSlug } from "../lib/gameTaxonomy.js";
import { syncProviderFeaturedGame } from "../lib/providerGameProfile.js";
import { gameSlugsForFilter } from "../lib/listingMappers.js";

/**
 * POST /api/rentals/quick  { providerUsername, hours, gameSlug, platformFeePercent? }
 */
export async function quickRent(req, res) {
    try {
        const providerUsername = normalizeSlug(req.body?.providerUsername);
        const hours = Number(req.body?.hours);
        const platformFeePercent = Math.min(100, Math.max(0, Number(req.body?.platformFeePercent ?? 15) || 15));

        if (!providerUsername || Number.isNaN(hours) || hours < 0.25 || hours > 500) {
            return res.status(400).json({ message: "Thiếu providerUsername hoặc số giờ không hợp lệ (0.25–500)." });
        }

        const gameSlug = normalizeSlug(req.body?.gameSlug);
        if (!gameSlug || !isAllowedSlug(gameSlug)) {
            return res.status(400).json({ message: "Vui lòng chọn game muốn thuê." });
        }

        const provider = await User.findOne({ username: providerUsername });
        if (!provider || provider.accountType !== "provider") {
            return res.status(400).json({ message: "Người chơi này không nhận thuê công khai." });
        }

        const offeredGames = gameSlugsForFilter(provider);
        if (!offeredGames.includes(gameSlug)) {
            return res.status(400).json({ message: "Người cho thuê không hỗ trợ game này." });
        }

        if (String(provider._id) === String(req.user._id)) {
            return res.status(400).json({ message: "Không thể thuê chính mình." });
        }

        const pricePerHour = typeof provider.playerListing?.pricePerHour === "number" ? provider.playerListing.pricePerHour : 55000;
        const grossVnd = Math.round(hours * pricePerHour);
        const platformFeeVnd = Math.round((grossVnd * platformFeePercent) / 100);
        const providerPayoutVnd = grossVnd - platformFeeVnd;

        if (grossVnd <= 0) {
            return res.status(400).json({ message: "Giá trị giao dịch không hợp lệ." });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const renter = await User.findById(req.user._id).session(session);
                if (!renter) {
                    throw new Error("NO_RENTER");
                }
                const balance = Math.max(0, Number(renter.walletBalanceVnd) || 0);
                if (balance < grossVnd) {
                    throw new Error("INSUFFICIENT_FUNDS");
                }

                const prov = await User.findById(provider._id).session(session);
                if (!prov || prov.accountType !== "provider") {
                    throw new Error("NO_PROVIDER");
                }

                renter.walletBalanceVnd = balance - grossVnd;
                const provBal = Math.max(0, Number(prov.walletBalanceVnd) || 0);
                prov.walletBalanceVnd = provBal + providerPayoutVnd;

                await renter.save({ session });
                await prov.save({ session });

                await Booking.create(
                    [
                        {
                            renterUserId: renter._id,
                            providerUserId: prov._id,
                            hours,
                            pricePerHourVnd: pricePerHour,
                            grossVnd,
                            platformFeePercent,
                            platformFeeVnd,
                            status: "completed",
                            note: "Thuê nhanh từ app",
                            source: "quick_rent",
                            gameSlug,
                        },
                    ],
                    { session }
                );
            });
        } catch (inner) {
            const code = inner instanceof Error ? inner.message : "";
            if (code === "INSUFFICIENT_FUNDS") {
                return res.status(400).json({ message: "Số dư ví không đủ. Vui lòng nạp thêm." });
            }
            if (code === "NO_PROVIDER") {
                return res.status(400).json({ message: "Người cho thuê không còn khả dụng." });
            }
            if (code === "NO_RENTER") {
                return res.status(404).json({ message: "Không tìm thấy tài khoản." });
            }
            throw inner;
        } finally {
            session.endSession();
        }

        await syncProviderFeaturedGame(provider._id);

        const userOut = await User.findById(req.user._id).select("-hashedPassword").lean();
        return res.status(201).json({
            user: userOut,
            booking: { grossVnd, platformFeeVnd, providerPayoutVnd, gameSlug },
        });
    } catch (e) {
        console.error("quickRent:", e);
        return res.status(500).json({ message: "Giao dịch thất bại." });
    }
}
