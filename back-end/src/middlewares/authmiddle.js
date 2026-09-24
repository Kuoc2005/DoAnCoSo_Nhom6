import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const protectedRoute = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Không có token'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decoded.userId)
            .select('-hashedPassword');

        if (!user) {
            return res.status(404).json({
                message: 'Người dùng không tồn tại'
            });
        }

        req.user = user;

        next();

    } catch (error) {

        return res.status(401).json({
            message: 'Token không hợp lệ'
        });
    }
};