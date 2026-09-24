import mongoose from "mongoose";

const playerReviewSchema = new mongoose.Schema(
    {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true, maxlength: 600, default: "" },
    },
    { timestamps: true }
);

playerReviewSchema.index({ authorId: 1, targetUserId: 1 }, { unique: true });

const PlayerReview = mongoose.model("PlayerReview", playerReviewSchema);
export default PlayerReview;
