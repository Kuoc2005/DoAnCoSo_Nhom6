import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashedPassword: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    /** Người thuê (mặc định) vs người cho thuê sau khi admin duyệt đơn */
    accountType: {
        type: String,
        enum: ["renter", "provider"],
        default: "renter",
    },
    /** Ví (VND) — nạp tiền demo, thanh toán thuê nhanh */
    walletBalanceVnd: { type: Number, default: 0, min: 0, max: 9_999_999_999 },
    /** Tổng đã nạp (demo) — dùng bảng xếp hạng */
    totalTopUpVnd: { type: Number, default: 0, min: 0, max: 9_999_999_999 },
    avatarUrl: {
        type: String,// link CDN hien thi hinh
    },
    avatarID: {
        type: String,// id hinh tren cloudinary
    },
    bio: {
        type: String,
        maxlength: 500,
    },
    phone: {
        type: String,
        sparse: true,
    },
    /** Hiển thị trên hub / explore — public */
    playerListing: {
        pricePerHour: {
            type: Number,
            default: 55000,
            min: 0,
            max: 50_000_000
        },

        // Giữ lại để tương thích code cũ
        rankLabel: {
            type: String,
            default: "",
            maxlength: 80
        },

        // Rank theo từng game
        ranks: [
            {
                gameSlug: {
                    type: String,
                    required: true,
                    lowercase: true,
                    trim: true
                },

                rankLabel: {
                    type: String,
                    required: true,
                    maxlength: 80,
                    trim: true
                }
            }
        ],

        primaryGameSlug: {
            type: String,
            default: "valorant",
            lowercase: true,
            trim: true
        },

        /** Game tự động (hay thuê / hay chơi) */
        featuredGameSlug: {
            type: String,
            default: "",
            lowercase: true,
            trim: true
        },

        ratingAvg: {
            type: Number,
            default: 4.5,
            min: 0,
            max: 5
        },

        reviewCount: {
            type: Number,
            default: 0,
            min: 0
        },

        voiceOk: {
            type: Boolean,
            default: true
        },

        isLive: {
            type: Boolean,
            default: false
        },

        isVerifiedProvider: {
            type: Boolean,
            default: false
        },

        listingCoverUrl: {
            type: String,
            default: "",
            maxlength: 2000
        },
    },
    /** Đơn đăng ký làm người cho thuê (hiển thị trên hub sau khi duyệt) */
    providerApplication: {
        status: {
            type: String,
            enum: ["none", "pending", "approved", "rejected"],
            default: "none",
        },
        /** Nội dung đơn — giới thiệu bản thân / kinh nghiệm */
        pitch: { type: String, maxlength: 800, default: "" },
        appliedAt: { type: Date },
        /** Game đăng ký cho thuê (slug danh mục) */
        primaryGameSlug: { type: String, default: "", lowercase: true, trim: true, maxlength: 64 },
        gender: {
            type: String,
            enum: ["male", "female", "other", "prefer_not_say"],
            default: "prefer_not_say",
        },
        /** Giá đề xuất (VND/giờ) — admin duyệt sẽ ghi vào playerListing */
        proposedPricePerHour: { type: Number, default: 0, min: 0, max: 50_000_000 },
        /** URL ảnh minh chứng kỹ năng (tối đa 6) */
        skillImageUrls: {
            type: [String],
            default: [],
            validate: {
                validator(arr) {
                    return Array.isArray(arr) && arr.length <= 6;
                },
                message: "Tối đa 6 ảnh kỹ năng",
            },
        },
    },
    gamingProfile: {
        favoriteSlugs: {
            type: [String],
            default: [],
            validate: {
                validator(arr) {
                    return arr.length <= 32;
                },
                message: "Quá nhiều game yêu thích",
            },
        },
        playHistory: {
            type: [
                {
                    gameSlug: { type: String, required: true, trim: true, lowercase: true },
                    hoursPlayed: { type: Number, min: 0, max: 50000, default: 0 },
                    sessionsCount: { type: Number, min: 0, default: 0 },
                    lastPlayedAt: { type: Date },
                },
            ],
            default: [],
            validate: {
                validator(arr) {
                    return arr.length <= 64;
                },
                message: "Quá nhiều dòng lịch sử",
            },
        },
    },
}, {
    timestamps: true,
}
);
const User = mongoose.model("User", userSchema);
export default User;