import { useMemo } from "react";
import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileLayout() {
  const { user, ready } = useAuth();

  const tabs = useMemo(() => {
    const base: { to: string; label: string; end?: boolean }[] = [
      { to: "/profile", label: "Tổng quan", end: true },
      { to: "/profile/account", label: "Tài khoản" },
      { to: "/profile/wallet", label: "Ví & nạp tiền" },
    ];
    if (user?.accountType !== "provider") {
      base.push({ to: "/profile/become-provider", label: "Đăng ký duo" });
    }
    base.push({ to: "/profile/gaming", label: "Sở thích & AI" });
    if (user?.accountType === "provider") {
      base.push({ to: "/profile/provider-studio", label: "Studio cho thuê" });
    } else {
      base.push({ to: "/profile/listing", label: "Thẻ duo" });
    }
    return base;
  }, [user?.accountType]);

  return (
    <div className="content-playerduo max-w-[1000px] pb-20">
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-black/[0.06] bg-gradient-to-br from-white via-[#faf8ff] to-[#f3efff] px-6 py-9 shadow-[0_12px_40px_-16px_rgba(100,96,255,0.22)] sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 top-0 size-72 rounded-full bg-[#6460FF]/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 left-10 size-48 rounded-full bg-[#7B19D8]/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="" className="size-10 shrink-0" width={40} height={40} />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">Player Duo</p>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#280071] sm:text-3xl">Hồ sơ của bạn</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#666666]">
              {ready && user?.accountType === "provider"
                ? "Quản lý tài khoản, ví, sở thích AI và Studio cho thuê — giao diện gọn gàng giống hub chính."
                : "Tài khoản, ví, đăng ký làm duo, dữ liệu ghép cặp và thẻ hiển thị — tất cả tại một nơi."}
            </p>
          </div>
          {ready && user ? (
            <div className="shrink-0 rounded-2xl border border-black/[0.06] bg-white/90 px-4 py-3 text-right shadow-sm backdrop-blur-sm">
              <p className="truncate text-sm font-bold text-[#280071]">{user.displayName}</p>
              <p className="truncate font-mono text-xs text-[#999999]">@{user.username}</p>
            </div>
          ) : null}
        </div>

        <nav className="relative mt-8 flex flex-wrap gap-2 border-t border-black/[0.06] pt-6">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-[#6460FF] text-white shadow-[0_4px_14px_-4px_rgba(100,96,255,0.55)]"
                    : "bg-[rgb(0_0_0_/_0.04)] text-[#354052] hover:bg-[#F1EEFF] hover:text-[#280071]"
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
