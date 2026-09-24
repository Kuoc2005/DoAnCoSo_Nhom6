import { useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  LogOut,
  Store,
  TrendingUp,
  Users,
  UserSearch,
  ListTree,
  MessagesSquare,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Tổng quan", end: true, icon: LayoutDashboard },
  { to: "/admin/dashboard", label: "Thống kê", end: false, icon: BarChart3 },
  { to: "/admin/revenue", label: "Doanh thu", end: false, icon: TrendingUp },
  { to: "/admin/providers", label: "Người cho thuê", end: false, icon: Store },
  { to: "/admin/hub-listings", label: "Listing hub", end: false, icon: ListTree },
  { to: "/admin/users", label: "Người dùng", end: false, icon: Users },
  { to: "/admin/seekers", label: "Tìm bạn chơi", end: false, icon: UserSearch },
  { to: "/admin/messages", label: "Tin nhắn", end: false, icon: MessagesSquare },
];

export function AdminLayout() {
  const { user, ready, signOut } = useAuth();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);

  const isAdmin = (user?.role || "user") === "admin";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Đã đăng xuất.");
    } catch {
      toast.error("Đăng xuất thất bại.");
    } finally {
      setSigningOut(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117] text-slate-300">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-200">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/[0.07] bg-gradient-to-b from-[#12141c] to-[#0a0c10] px-3 py-5">
        <NavLink
          to="/"
          className="mb-6 flex items-center gap-3 rounded-xl px-2 py-2 text-white transition-colors hover:bg-white/5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1a1428] ring-1 ring-white/10">
            <img src="/logo.svg" alt="Player Duo" className="size-7" width={28} height={28} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold leading-tight tracking-tight text-white">Player Duo</span>
            <span className="block text-[11px] font-medium text-slate-500">Về trang chủ</span>
          </span>
        </NavLink>

        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Quản trị</p>
        <h2 className="mt-1 px-2 text-base font-bold text-white">Bảng điều khiển</h2>

        <nav className="mt-5 flex flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-[#6460FF]/25 text-white shadow-[inset_0_0_0_1px_rgba(100,96,255,0.35)]" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  )
                }
              >
                <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 pt-3">
          <p className="truncate px-2 text-xs text-slate-500" title={user.email}>
            {user.displayName}
          </p>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <LogOut className="size-4" aria-hidden />
            {signingOut ? "Đang thoát…" : "Đăng xuất"}
          </button>
        </div>
      </aside>

      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
