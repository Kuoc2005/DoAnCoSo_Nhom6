import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { toast } from "sonner";
import { Bell, ChevronDown, Gift, LogOut, MessageCircle, Search, Shield, User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { MatchAssistantChat } from "@/components/match/MatchAssistantChat";

export function HubLayout() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, ready, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Đã đăng xuất.");
      setUserMenuOpen(false);
    } catch {
      toast.error("Đăng xuất thất bại.");
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ebe8ff_0%,#f4f2fb_28%,#faf9ff_100%)]">
      <header
        className={cn(
          "sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-black/[0.06] bg-white/90 px-3 py-2 shadow-[0_1px_0_rgb(0_0_0_/_0.04)] backdrop-blur-md sm:gap-4 sm:px-5 sm:py-2.5 lg:px-8"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <NavLink to="/" className="flex shrink-0 items-center gap-2 truncate no-underline">
            <img src="/logo.svg" alt="" className="size-9 shrink-0" width={36} height={36} />
            <span className="hidden bg-gradient-to-r from-[#280071] to-[#6460FF] bg-clip-text text-lg font-black tracking-tight text-transparent sm:inline">
              Player Duo
            </span>
          </NavLink>

          <nav className="ml-1 hidden min-w-0 items-center gap-0.5 lg:flex">
            <NavLink to="/" end className="nav-top-playerduo-link rounded-lg">
              Trang chủ
            </NavLink>
            <NavLink to="/explore" className="nav-top-playerduo-link rounded-lg">
              Khám phá
            </NavLink>
            <NavLink to="/leaderboard" className="nav-top-playerduo-link rounded-lg">
              Xếp hạng
            </NavLink>
            <NavLink to="/profile/become-provider" className="nav-top-playerduo-link rounded-lg">
              Cho thuê
            </NavLink>
            <NavLink to="/profile" end className="nav-top-playerduo-link rounded-lg">
              Hồ sơ
            </NavLink>
            {user ? (
              <NavLink to="/messages" className="nav-top-playerduo-link rounded-lg">
                Tin nhắn
              </NavLink>
            ) : null}
            {user?.role === "admin" ? (
              <NavLink to="/admin" className="nav-top-playerduo-link rounded-lg">
                Quản trị
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="mx-1 hidden min-w-0 max-w-md flex-1 md:block">
          <form action="/explore" method="get" className="relative w-full" role="search">
            <label htmlFor="pd-nav-search" className="sr-only">
              Tìm game hoặc người chơi
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a295bd]" aria-hidden />
            <input
              id="pd-nav-search"
              name="q"
              type="search"
              placeholder="Tìm game, người chơi..."
              className="h-9 w-full rounded-full border border-[#e8e4f5] bg-[#f7f5fc] py-2 pr-3 pl-9 text-sm text-[#280071] outline-none transition placeholder:text-[#999999] focus:border-[#6460FF] focus:bg-white focus:ring-2 focus:ring-[#6460FF]/20"
            />
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="hidden size-9 items-center justify-center rounded-full text-[#354052] hover:bg-[#f1eeff] xl:flex"
            aria-label="Ưu đãi"
          >
            <Gift className="size-[18px]" />
          </button>
          <button
            type="button"
            className="hidden size-9 items-center justify-center rounded-full text-[#354052] hover:bg-[#f1eeff] xl:flex"
            aria-label="Thông báo"
          >
            <Bell className="size-[18px]" />
          </button>

          {ready && user ? (
            <div className="relative flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                className="flex max-w-[200px] items-center gap-2 rounded-full border border-[#e8e4f5] bg-white py-1 pl-1 pr-2 shadow-sm transition hover:border-[#6460FF]/40 hover:shadow-md sm:pr-3"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#6460FF] to-[#7B19D8] text-sm font-bold text-white">
                  {user.avatarUrl?.trim() ? (
                    <img src={user.avatarUrl.trim()} alt="" className="size-full object-cover" />
                  ) : (
                    user.displayName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <span className="hidden min-w-0 truncate text-left text-sm font-semibold text-[#280071] md:block">{user.displayName}</span>
                <ChevronDown className={cn("size-4 shrink-0 text-[#999999] transition", userMenuOpen && "rotate-180")} aria-hidden />
              </button>

              {userMenuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default bg-transparent"
                    aria-label="Đóng menu người dùng"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black/[0.08] bg-white py-1 shadow-xl ring-1 ring-black/[0.04]"
                    role="menu"
                  >
                    <NavLink
                      to="/profile"
                      end
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#354052] hover:bg-[#f1eeff] hover:text-[#280071]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="size-4 text-[#6460FF]" aria-hidden />
                      Hồ sơ của tôi
                    </NavLink>
                    <NavLink
                      to="/profile/wallet"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#354052] hover:bg-[#f1eeff] hover:text-[#280071]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Ví &amp; nạp tiền
                    </NavLink>
                    <NavLink
                      to="/messages"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#354052] hover:bg-[#f1eeff] hover:text-[#280071]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <MessageCircle className="size-4 text-[#6460FF]" aria-hidden />
                      Tin nhắn hỗ trợ
                    </NavLink>
                    {user.role === "admin" ? (
                      <NavLink
                        to="/admin"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#354052] hover:bg-[#f1eeff] hover:text-[#280071]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Shield className="size-4 text-[#6460FF]" aria-hidden />
                        Quản trị
                      </NavLink>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 border-t border-black/[0.06] px-4 py-2.5 text-left text-sm font-medium text-[#354052] hover:bg-[#fff5f5] hover:text-red-600"
                      onClick={() => void handleSignOut()}
                    >
                      <LogOut className="size-4" aria-hidden />
                      Đăng xuất
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <>
              <NavLink to="/signin" className="link-playerduo-secondary hidden text-nowrap text-sm sm:inline">
                Đăng nhập
              </NavLink>
              <Link to="/signup" className={cn(buttonVariants({ variant: "playerduoPrimary" }), "min-h-9 px-4 text-sm")}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="border-b border-[#e8e4f5] bg-white/80 px-3 py-2 md:hidden">
        <form action="/explore" method="get" className="relative" role="search">
          <label htmlFor="pd-nav-search-mobile" className="sr-only">
            Tìm game hoặc người chơi
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a295bd]" aria-hidden />
          <input
            id="pd-nav-search-mobile"
            name="q"
            type="search"
            placeholder="Tìm game, người chơi..."
            className="h-10 w-full rounded-full border border-[#e8e4f5] bg-[#f7f5fc] py-2 pr-3 pl-9 text-sm text-[#280071] outline-none placeholder:text-[#999999] focus:border-[#6460FF] focus:ring-2 focus:ring-[#6460FF]/20"
          />
        </form>
      </div>

      <div className="border-b border-[#e8e4f5] bg-white/80 px-3 py-2 lg:hidden">
        <nav className="flex gap-1.5 overflow-x-auto pb-0.5">
          <NavLink to="/" end className="nav-top-playerduo-link shrink-0 rounded-full px-3">
            Trang chủ
          </NavLink>
          <NavLink to="/explore" className="nav-top-playerduo-link shrink-0 rounded-full px-3">
            Khám phá
          </NavLink>
          <NavLink to="/leaderboard" className="nav-top-playerduo-link shrink-0 rounded-full px-3">
            Xếp hạng
          </NavLink>
          <NavLink to="/profile/become-provider" className="nav-top-playerduo-link shrink-0 rounded-full px-3">
            Cho thuê
          </NavLink>
          <NavLink to="/profile" end className="nav-top-playerduo-link shrink-0 rounded-full px-3">
            Hồ sơ
          </NavLink>
          {user ? (
            <NavLink to="/messages" className="nav-top-playerduo-link shrink-0 rounded-full px-3">
              Tin nhắn
            </NavLink>
          ) : null}
          {user?.role === "admin" ? (
            <NavLink to="/admin" className="nav-top-playerduo-link shrink-0 rounded-full px-3">
              Quản trị
            </NavLink>
          ) : null}
        </nav>
      </div>

      <div className="container-playerduo pb-12 pt-5 lg:pt-8">
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <MatchAssistantChat />
    </div>
  );
}
