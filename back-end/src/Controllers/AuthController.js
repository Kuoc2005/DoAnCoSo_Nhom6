import bcrypt from "bcrypt";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

function cookieOptions() {
    const secure = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure,
        sameSite: secure ? "none" : "lax",
        path: "/",
        maxAge: REFRESH_TOKEN_TTL,
    };
}

export const signUp = async (req, res) => {
    try {
        const { username, password, email, displayName, bio } = req.body;

        if (!username || !password || !email || !displayName) {
            return res.status(400).json({
                message: "Cần có: username, password, email, displayName",
            });
        }

        const usernameNorm = String(username).trim().toLowerCase();
        const emailNorm = String(email).trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
            return res.status(400).json({ message: "Email không hợp lệ." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự." });
        }

        const duplicate = await User.findOne({
            $or: [{ username: usernameNorm }, { email: emailNorm }],
        });
        if (duplicate) {
            return res.status(400).json({
                message: "Tên đăng nhập hoặc email đã được sử dụng.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username: usernameNorm,
            hashedPassword,
            email: emailNorm,
            displayName: String(displayName).trim(),
            bio: bio != null && String(bio).trim() ? String(bio).trim().slice(0, 500) : undefined,
            accountType: "renter",
        });

        return res.sendStatus(204);
    } catch (error) {
        console.error("signUp:", error);
        res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

async function issueTokensAndSession(user, res) {
    const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
        userId: user._id,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie("refreshToken", refreshToken, cookieOptions());

    return accessToken;
}

export const signIn = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Cần có tên đăng nhập/email và mật khẩu." });
        }

        const login = String(username).trim().toLowerCase();

        const user = await User.findOne({
            $or: [{ username: login }, { email: login }],
        });
        if (!user) {
            return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
        }

        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
        }

        const accessToken = await issueTokensAndSession(user, res);

        return res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken,
        });
    } catch (error) {
        console.error("signIn:", error);
        res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

export const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ message: "Không có phiên đăng nhập." });
        }

        const session = await Session.findOne({ refreshToken: token });
        if (!session || session.expiresAt < new Date()) {
            if (session) await Session.deleteOne({ _id: session._id });
            res.clearCookie("refreshToken", { ...cookieOptions(), maxAge: 0 });
            return res.status(401).json({ message: "Phiên đã hết hạn." });
        }

        const user = await User.findById(session.userId);
        if (!user) {
            await Session.deleteOne({ _id: session._id });
            res.clearCookie("refreshToken", { ...cookieOptions(), maxAge: 0 });
            return res.status(401).json({ message: "Người dùng không tồn tại." });
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: ACCESS_TOKEN_TTL,
        });

        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error("refresh:", error);
        res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};

export const signOut = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await Session.deleteOne({ refreshToken: token });
        }
        res.clearCookie("refreshToken", { ...cookieOptions(), maxAge: 0 });
        return res.sendStatus(204);
    } catch (error) {
        console.error("signOut:", error);
        res.status(500).json({ message: error.message || "Lỗi máy chủ" });
    }
};
