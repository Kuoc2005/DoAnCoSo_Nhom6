import bcrypt from "bcrypt";
import User from "../models/user.js";


export async function promoteBootstrapAdmin() {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.warn("[bootstrap] BOOTSTRAP_ADMIN_EMAIL không hợp lệ, bỏ qua.");
        return;
    }

    const existing = await User.findOne({ email });

    if (existing) {
        const result = await User.updateOne({ email }, { $set: { role: "admin" } });
        if (result.matchedCount > 0) {
            console.log(`[bootstrap] Đã gán quyền admin cho email: ${email}`);
        }
        return;
    }

    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
    const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim().toLowerCase();
    const displayName = process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME?.trim() || "Quản trị";

    if (!password || !username) {
        console.warn(
            "[bootstrap] Chưa có user với email này. Thêm BOOTSTRAP_ADMIN_USERNAME và BOOTSTRAP_ADMIN_PASSWORD vào .env để tự tạo tài khoản admin, hoặc đăng ký trước rồi khởi động lại server."
        );
        return;
    }

    if (password.length < 6) {
        console.warn("[bootstrap] BOOTSTRAP_ADMIN_PASSWORD cần tối thiểu 6 ký tự.");
        return;
    }

    const dup = await User.findOne({ $or: [{ username }, { email }] });
    if (dup) {
        console.warn("[bootstrap] Username hoặc email đã tồn tại — không tạo admin mới.");
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await User.create({
            username,
            email,
            hashedPassword,
            displayName,
            role: "admin",
            accountType: "renter",
        });
        console.log(`[bootstrap] Đã tạo tài khoản admin: ${username} <${email}>`);
    } catch (e) {
        console.error("[bootstrap] Không tạo được admin:", e?.message || e);
    }
}
