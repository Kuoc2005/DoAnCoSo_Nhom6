import { Link } from "react-router";
import { Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileAccountPage() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="pd-text-body text-[#666666]">Đang tải...</p>;
  }

  if (!user) {
    return (
      <div className="pd-card-default text-center">
        <p className="pd-text-body text-[#354052]">Đăng nhập để xem hồ sơ.</p>
        <Link to="/signin" className="mt-4 inline-block font-semibold text-[#6460FF] underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="pd-card-default">
        <div className="flex items-center gap-3 border-b border-black/[0.06] pb-4">
          <div className="flex size-12 items-center justify-center rounded-[12px] bg-[#F1EEFF] text-[#6460FF]">
            <User className="size-6" aria-hidden />
          </div>
          <div>
            <h2 className="pd-text-h2 text-[#354052]">{user.displayName}</h2>
            <p className="pd-text-caption text-[#999999]">@{user.username}</p>
          </div>
        </div>
        <div className="mt-6 flex items-start gap-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-[#6460FF]" aria-hidden />
          <div>
            <p className="pd-text-label text-[#354052]">Email</p>
            <p className="pd-text-body mt-1 text-[#666666]">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 rounded-[10px] border border-black/[0.08] bg-[#faf9ff] px-4 py-3">
          <p className="pd-text-caption text-[#354052]">
            Loại tài khoản:{" "}
            <strong className="text-[#6460FF]">
              {user.accountType === "provider" ? "Người cho thuê" : "Người thuê"}
            </strong>
            {" "}
            · Ví:{" "}
            <strong className="text-[#354052]">{new Intl.NumberFormat("vi-VN").format(user.walletBalanceVnd ?? 0)} ₫</strong>
            {user.role === "admin" ? (
              <>
                {" "}
                ·{" "}
                <Link className="font-semibold text-[#6460FF] underline" to="/admin">
                  Mở trang quản trị
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="pd-card-default flex flex-col justify-center bg-gradient-to-br from-[#faf9ff] to-white">
        <h3 className="pd-text-h3 text-[#280071]">Điều hướng nhanh</h3>
        <ul className="mt-4 space-y-3 pd-text-body text-[#354052]">
          <li>
            →{" "}
            <Link className="font-semibold text-[#6460FF] underline-offset-2 hover:underline" to="/profile/gaming">
              Sở thích &amp; AI
            </Link>{" "}
            để ghép đồng đội thông minh hơn.
          </li>
          {user.accountType !== "provider" ? (
            <li>
              →{" "}
              <Link className="font-semibold text-[#6460FF] underline-offset-2 hover:underline" to="/profile/become-provider">
                Đăng ký duo
              </Link>{" "}
              — form game, giá, ảnh kỹ năng và giới thiệu gửi admin duyệt.
            </li>
          ) : null}
          <li>
            →{" "}
            <Link className="font-semibold text-[#6460FF] underline-offset-2 hover:underline" to="/profile/listing">
              Thẻ duo
            </Link>{" "}
            {user.accountType === "provider"
              ? "— nếu đã là người cho thuê, dùng Studio cho thuê để chỉnh hiển thị công khai."
              : "để chuẩn bị hiển thị sau khi được duyệt làm người cho thuê."}
          </li>
          <li>
            →{" "}
            <Link className="font-semibold text-[#6460FF] underline-offset-2 hover:underline" to="/explore">
              Khám phá
            </Link>{" "}
            xem người cho thuê đã duyệt.
          </li>
          <li>
            →{" "}
            <Link className="font-semibold text-[#6460FF] underline-offset-2 hover:underline" to="/profile/wallet">
              Ví &amp; nạp tiền
            </Link>{" "}
            để thuê nhanh người chơi.
          </li>
          {user.role === "admin" ? (
            <li>
              →{" "}
              <Link className="font-semibold text-[#6460FF] underline-offset-2 hover:underline" to="/admin">
                Trang quản trị
              </Link>{" "}
              (bảng điều khiển riêng).
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
