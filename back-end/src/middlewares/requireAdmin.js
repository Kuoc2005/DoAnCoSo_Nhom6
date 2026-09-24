export const requireAdmin = (req, res, next) => {
    const role = req.user?.role || "user";
    if (role !== "admin") {
        return res.status(403).json({ message: "Chỉ quản trị viên mới được truy cập." });
    }
    next();
};
