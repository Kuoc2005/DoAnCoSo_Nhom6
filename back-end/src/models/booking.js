import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        renterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        providerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        hours: { type: Number, required: true, min: 0.25, max: 500 },
        pricePerHourVnd: { type: Number, required: true, min: 0 },
        grossVnd: { type: Number, required: true, min: 0 },
        platformFeePercent: { type: Number, default: 15, min: 0, max: 100 },
        platformFeeVnd: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["pending", "completed", "cancelled"],
            default: "completed",
            index: true,
        },
        note: { type: String, maxlength: 500, default: "" },
        /** Game được thuê — dùng thống kê game nổi bật */
        gameSlug: { type: String, default: "", lowercase: true, trim: true, maxlength: 64 },
        createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        source: { type: String, enum: ["admin", "quick_rent"], default: "admin" },
    },
    { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
