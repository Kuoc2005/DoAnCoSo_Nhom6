import { Link } from "react-router";
import { BarChart3 } from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Tổng quan</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Đăng ký mặc định là <strong className="text-slate-200">người thuê</strong>. Sau khi bạn duyệt đơn, tài khoản trở thành{" "}
          <strong className="text-slate-200">người cho thuê</strong> và xuất hiện trên trang chủ / Khám phá (tài khoản{" "}
          <strong className="text-slate-200">admin</strong> không hiển thị ở hub công khai).
        </p>
      </div>

      <Link
        to="/admin/dashboard"
        className="flex items-center gap-4 rounded-xl border border-[#6460FF]/40 bg-[#6460FF]/15 p-5 transition hover:bg-[#6460FF]/25"
      >
        <span className="flex size-12 items-center justify-center rounded-lg bg-[#6460FF]/30 text-white">
          <BarChart3 className="size-6" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-bold text-white">Dashboard thống kê</span>
          <span className="mt-0.5 block text-sm text-slate-400">Số liệu tổng hợp, cơ cấu vai trò và doanh thu theo tháng.</span>
        </span>
      </Link>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Đi nhanh</h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          <li>
            <Link className="text-[#8b86ff] underline hover:text-white" to="/admin/dashboard">
              Dashboard thống kê
            </Link>
          </li>
          <li>
            <Link className="text-[#8b86ff] underline hover:text-white" to="/admin/providers">
              Duyệt đơn người cho thuê
            </Link>
          </li>
          <li>
            <Link className="text-[#8b86ff] underline hover:text-white" to="/admin/revenue">
              Doanh thu &amp; giao dịch
            </Link>
          </li>
          <li>
            <Link className="text-[#8b86ff] underline hover:text-white" to="/admin/users">
              Người dùng
            </Link>
          </li>
          <li>
            <Link className="text-[#8b86ff] underline hover:text-white" to="/admin/messages">
              Tin nhắn hỗ trợ
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
