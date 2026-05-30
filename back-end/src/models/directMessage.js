import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema(
    {
        /** Hai participant đã sắp xếp theo thứ tự chuỗi ObjectId (nhỏ trước). */
        participantA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        participantB: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true, trim: true, maxlength: 2000 },
    },
    { timestamps: true }
);

directMessageSchema.index({ participantA: 1, participantB: 1, createdAt: 1 });

const DirectMessage = mongoose.model("DirectMessage", directMessageSchema);
export default DirectMessage;
