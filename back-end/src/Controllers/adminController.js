import User from "../models/user.js";
import Booking from "../models/booking.js";
import { mapUserToListingPayload } from "../lib/listingMappers.js";
import { isAllowedSlug, normalizeSlug, coverUrlForSlug } from "../lib/gameTaxonomy.js";
import { computeFeaturedGameSlug, syncProviderFeaturedGame } from "../lib/providerGameProfile.js";

export const listUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-hashedPassword")
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json({ users });
    } catch (error) {
        console.error("listUsers:", error);
        return res.status(500).json({ message: "Không thể tải danh sách người dùng." });
    }
};

/** Người có hồ sơ gaming (tìm/ghép đồng đội). */
export const listSeekers = async (req, res) => {
    try {
        const seekers = await User.find({
            $or: [{ "gamingProfile.favoriteSlugs.0": { $exists: true } }, { "gamingProfile.playHistory.0": { $exists: true } }],
        })
            .select("-hashedPassword")
            .sort({ updatedAt: -1 })
            .limit(300)
            .lean();
        return res.status(200).json({ seekers });
    } catch (error) {
        console.error("listSeekers:", error);
        return res.status(500).json({ message: "Không thể tải danh sách người tìm bạn chơi." });
    }
};

/** Snapshot listing hub cho admin. */
export const listHubListings = async (req, res) => {
    try {
        const docs = await User.find()
            .select("-hashedPassword")
            .sort({ "playerListing.ratingAvg": -1, createdAt: -1 })
            .limit(200)
            .lean();
        const listings = docs.map((u) => ({
            ...mapUserToListingPayload(u),
            email: u.email,
            accountType: u.accountType ?? "legacy",
            providerStatus: u.providerApplication?.status ?? "none",
            isVerifiedProvider: Boolean(u.playerListing?.isVerifiedProvider),
        }));
        return res.status(200).json({ listings });
    } catch (error) {
        console.error("listHubListings:", error);
        return res.status(500).json({ message: "Không thể tải listing." });
    }
};

export const listProviderApplications = async (req, res) => {
    try {
        const apps = await User.find({ "providerApplication.status": { $ne: "none" } })
            .select("-hashedPassword")
            .sort({ "providerApplication.appliedAt": -1 })
            .limit(200)
            .lean();
        return res.status(200).json({ applications: apps });
    } catch (error) {
        console.error("listProviderApplications:", error);
        return res.status(500).json({ message: "Không thể tải đơn đăng ký." });
    }
};

/** */
export const decideProviderApplication = async (req, res) => {
    try {
        const { status } = req.body ?? {};
        if (status !== "approved" && status !== "rejected") {
            return res.status(400).json({ message: "status phải là approved hoặc rejected." });
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }
        user.providerApplication = user.providerApplication ?? {};
        user.playerListing = user.playerListing ?? {};

        if (status === "approved") {
            user.accountType = "provider";
            user.providerApplication.status = "approved";
            user.playerListing.isVerifiedProvider = true;
            const app = user.providerApplication;
            const gSlug = app?.primaryGameSlug ? normalizeSlug(app.primaryGameSlug) : "";
            if (gSlug && isAllowedSlug(gSlug)) {
                user.playerListing.primaryGameSlug = gSlug;
                user.playerListing.featuredGameSlug = gSlug;
                user.playerListing.listingCoverUrl = coverUrlForSlug(gSlug);
            }
            const p = Number(app?.proposedPricePerHour);
            if (!Number.isNaN(p) && p >= 10_000 && p <= 50_000_000) {
                user.playerListing.pricePerHour = Math.floor(p);
            }
            if (app?.pitch && typeof app.pitch === "string" && (!user.bio || !String(user.bio).trim())) {
                user.bio = String(app.pitch).trim().slice(0, 500);
            }
        } else {
            user.accountType = "renter";
            user.providerApplication.status = "rejected";
            user.playerListing.isVerifiedProvider = false;
        }

        await user.save();
        if (status === "approved") {
            await syncProviderFeaturedGame(user._id);
        }
        const out = await User.findById(user._id).select("-hashedPassword").lean();
        return res.status(200).json({ user: out });
    } catch (error) {
        console.error("decideProviderApplication:", error);
        return res.status(500).json({ message: "Không cập nhật được đơn." });
    }
};

export const listProviders = async (req, res) => {
    try {
        const providers = await User.find({ accountType: "provider" })
            .select("-hashedPassword")
            .sort({ updatedAt: -1 })
            .limit(300)
            .lean();
        return res.status(200).json({ providers });
    } catch (error) {
        console.error("listProviders:", error);
        return res.status(500).json({ message: "Không tải được danh sách người cho thuê." });
    }
};

/** Thu hồi quyền người cho thuê — tài khoản về người thuê, có thể gửi đơn lại. */
export const revokeProvider = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }
        if (user.role === "admin") {
            return res.status(400).json({ message: "Không thể thu hồi tài khoản admin." });
        }
        user.accountType = "renter";
        user.playerListing = user.playerListing ?? {};
        user.playerListing.isVerifiedProvider = false;
        user.providerApplication = user.providerApplication ?? {};
        user.providerApplication.status = "none";
        await user.save();
        const out = await User.findById(user._id).select("-hashedPassword").lean();
        return res.status(200).json({ user: out });
    } catch (error) {
        console.error("revokeProvider:", error);
        return res.status(500).json({ message: "Không cập nhật được." });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalAdmins,
            providersTotal,
            rentersTotal,
            pendingApps,
            bookingsCompleted,
            revenueAgg,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ accountType: "provider", role: { $ne: "admin" } }),
            User.countDocuments({ accountType: "renter" }),
            User.countDocuments({ "providerApplication.status": "pending" }),
            Booking.countDocuments({ status: "completed" }),
            Booking.aggregate([
                { $match: { status: "completed" } },
                { $group: { _id: null, platform: { $sum: "$platformFeeVnd" }, gross: { $sum: "$grossVnd" } } },
            ]),
        ]);
        const rev = revenueAgg[0] || { platform: 0, gross: 0 };
        return res.status(200).json({
            totalUsers,
            totalAdmins,
            providersTotal,
            rentersTotal,
            pendingProviderApplications: pendingApps,
            completedBookings: bookingsCompleted,
            totalPlatformRevenueVnd: rev.platform || 0,
            totalGrossTurnoverVnd: rev.gross || 0,
        });
    } catch (error) {
        console.error("getDashboardStats:", error);
        return res.status(500).json({ message: "Không tải được thống kê." });
    }
};

export const getRevenueReport = async (req, res) => {
    try {
        const byMonth = await Booking.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
                    platformFeeVnd: { $sum: "$platformFeeVnd" },
                    grossVnd: { $sum: "$grossVnd" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.y": -1, "_id.m": -1 } },
            { $limit: 36 },
        ]);
        return res.status(200).json({ byMonth });
    } catch (error) {
        console.error("getRevenueReport:", error);
        return res.status(500).json({ message: "Không tải được báo cáo doanh thu." });
    }
};

export const listBookings = async (req, res) => {
    try {
        const rows = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(200)
            .populate("renterUserId", "username displayName email")
            .populate("providerUserId", "username displayName email")
            .lean();
        const bookings = rows.map((b) => ({
            id: String(b._id),
            hours: b.hours,
            pricePerHourVnd: b.pricePerHourVnd,
            grossVnd: b.grossVnd,
            platformFeePercent: b.platformFeePercent,
            platformFeeVnd: b.platformFeeVnd,
            status: b.status,
            note: b.note,
            createdAt: b.createdAt,
            renter: b.renterUserId
                ? { username: b.renterUserId.username, displayName: b.renterUserId.displayName, email: b.renterUserId.email }
                : null,
            provider: b.providerUserId
                ? { username: b.providerUserId.username, displayName: b.providerUserId.displayName, email: b.providerUserId.email }
                : null,
        }));
        return res.status(200).json({ bookings });
    } catch (error) {
        console.error("listBookings:", error);
        return res.status(500).json({ message: "Không tải được giao dịch." });
    }
};

/**
 * POST body: { renterUsername, providerUsername, hours, pricePerHourVnd, platformFeePercent?, status?, note? }
 */
export const createBooking = async (req, res) => {
    try {
        const b = req.body ?? {};
        const renterUsername = String(b.renterUsername || "")
            .trim()
            .toLowerCase();
        const providerUsername = String(b.providerUsername || "")
            .trim()
            .toLowerCase();
        const hours = Number(b.hours);
        const pricePerHourVnd = Number(b.pricePerHourVnd);
        const platformFeePercent = Math.min(100, Math.max(0, Number(b.platformFeePercent ?? 15) || 15));
        const status = b.status === "pending" || b.status === "cancelled" ? b.status : "completed";
        const note = b.note != null ? String(b.note).trim().slice(0, 500) : "";

        if (!renterUsername || !providerUsername || Number.isNaN(hours) || hours <= 0 || Number.isNaN(pricePerHourVnd) || pricePerHourVnd < 0) {
            return res.status(400).json({ message: "Thiếu renterUsername, providerUsername, hours hoặc pricePerHourVnd." });
        }

        const [renter, provider] = await Promise.all([User.findOne({ username: renterUsername }), User.findOne({ username: providerUsername })]);
        if (!renter || !provider) {
            return res.status(400).json({ message: "Không tìm thấy người thuê hoặc người cho thuê." });
        }
        if (String(renter._id) === String(provider._id)) {
            return res.status(400).json({ message: "Hai bên không được trùng tài khoản." });
        }

        const grossVnd = Math.round(hours * pricePerHourVnd);
        const platformFeeVnd = Math.round((grossVnd * platformFeePercent) / 100);

        let gameSlug = normalizeSlug(b.gameSlug);
        if (!gameSlug || !isAllowedSlug(gameSlug)) {
            gameSlug = computeFeaturedGameSlug(provider);
        }

        await Booking.create({
            renterUserId: renter._id,
            providerUserId: provider._id,
            hours,
            pricePerHourVnd,
            grossVnd,
            platformFeePercent,
            platformFeeVnd,
            status,
            note,
            gameSlug,
            createdByAdminId: req.user._id,
            source: "admin",
        });

        if (status === "completed") {
            await syncProviderFeaturedGame(provider._id);
        }

        return res.status(201).json({ ok: true });
    } catch (error) {
        console.error("createBooking:", error);
        return res.status(500).json({ message: "Không tạo được giao dịch." });
    }
};
