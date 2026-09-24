import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
    {
        threadUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        authorRole: { type: String, enum: ["user", "admin"], required: true },
        text: { type: String, required: true, trim: true, maxlength: 2000 },
    },
    { timestamps: true }
);

supportMessageSchema.index({ threadUserId: 1, createdAt: 1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);
export default SupportMessage;
