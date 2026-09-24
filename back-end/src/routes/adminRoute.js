import express from "express";
import {
    createBooking,
    decideProviderApplication,
    getDashboardStats,
    getRevenueReport,
    listBookings,
    listHubListings,
    listProviderApplications,
    listProviders,
    listSeekers,
    listUsers,
    revokeProvider,
} from "../Controllers/adminController.js";
import {
    getSupportThreadMessagesAdmin,
    listSupportThreadsAdmin,
    postSupportReplyAdmin,
} from "../Controllers/supportMessageController.js";
import { protectedRoute } from "../middlewares/authmiddle.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

router.get("/dashboard-stats", protectedRoute, requireAdmin, getDashboardStats);
router.get("/revenue-report", protectedRoute, requireAdmin, getRevenueReport);
router.get("/bookings", protectedRoute, requireAdmin, listBookings);
router.post("/bookings", protectedRoute, requireAdmin, createBooking);
router.get("/providers", protectedRoute, requireAdmin, listProviders);
router.patch("/providers/:userId/revoke", protectedRoute, requireAdmin, revokeProvider);

router.get("/users", protectedRoute, requireAdmin, listUsers);
router.get("/seekers", protectedRoute, requireAdmin, listSeekers);
router.get("/hub-listings", protectedRoute, requireAdmin, listHubListings);
router.get("/provider-applications", protectedRoute, requireAdmin, listProviderApplications);
router.patch("/provider-applications/:userId", protectedRoute, requireAdmin, decideProviderApplication);

router.get("/support-threads", protectedRoute, requireAdmin, listSupportThreadsAdmin);
router.get("/support-threads/:userId/messages", protectedRoute, requireAdmin, getSupportThreadMessagesAdmin);
router.post("/support-messages", protectedRoute, requireAdmin, postSupportReplyAdmin);

export default router;
