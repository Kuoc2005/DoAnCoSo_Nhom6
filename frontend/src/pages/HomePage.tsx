import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  ChevronRight,
  Gamepad2,
  Headphones,
  MessageCircle,
  Mic2,
  Search,
  Handshake,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import type { CatalogHomeResponse, ListingCardPayload } from "@/types/catalog";

const HOT_TILE_GRADIENT: Record<string, string> = {
  valorant: "from-[#fd4556]/20 to-[#6460FF]/30",
  lol: "from-[#C89B3C]/25 to-[#280071]/20",
  cs2: "from-[#20AEFF]/20 to-[#354052]/25",
  pubgm: "from-[#FF731C]/15 to-[#9975FF]/25",
  freefire: "from-[#FF6B00]/20 to-[#6460FF]/25",
  genshin: "from-[#7BB6F9]/25 to-[#9B8FD9]/30",
  apex: "from-[#DA292A]/20 to-[#280071]/25",
  default: "from-[#9975FF]/20 to-[#20AEFF]/25",
};

function formatVnd(n: number) {
  return `${new Intl.NumberFormat("vi-VN").format(n)}đ/giờ`;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CatalogHomeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(getApiUrl("/api/catalog/home"))
      .then(async (res) => {
        if (!res.ok) throw new Error("Không tải được trang chủ.");
        return res.json() as Promise<CatalogHomeResponse>;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Không kết nối được máy chủ.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    if (q) navigate(`/explore?q=${encodeURIComponent(q)}`);
    else navigate("/explore");
  }

  const featured: ListingCardPayload[] = data?.featuredPlayers ?? [];

  return (
    <div className="content-playerduo space-y-10 pb-12 sm:space-y-14">
      <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#1e0a4d] via-[#3d2b8c] to-[#6460FF] px-5 py-12 shadow-[0_24px_60px_-24px_rgba(40,0,113,0.55)] sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#a78bfa]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[#38bdf8]/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center sm:text-left">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[#c4b5fd]" aria-hidden />
            Nền tảng duo · Voice · Ranked
          </p>
          <h1 className="text-balance text-3xl font-black leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl md:leading-[1.1]">
            Tìm đồng đội,
            <span className="mt-1 block bg-gradient-to-r from-[#c4b5fd] to-[#7dd3fc] bg-clip-text text-transparent sm:mt-2">
              mọi game — mọi khung giờ
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/85 sm:mx-0 sm:text-base">
            Khám phá người chơi, xem hồ sơ và thuê nhanh. Giao diện thân thiện dễ sử dụng
            <a
              href="https://playerduo.net/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#c4b5fd] underline decoration-white/30 underline-offset-2 hover:text-white"
            >
              Player Duo
            </a>
            .
          </p>
        </div>

        <form
          onSubmit={onSearchSubmit}
          className="relative z-10 mx-auto mt-10 max-w-2xl flex flex-col gap-2 rounded-2xl border border-white/25 bg-white p-2 shadow-2xl sm:flex-row sm:items-stretch sm:gap-0 sm:p-2"
        >
          <label className="sr-only" htmlFor="home-search">
            Tìm game thủ hoặc trò chơi
          </label>
          <div className="flex min-h-[48px] flex-1 items-center gap-3 rounded-[10px] bg-[#F5F5F5] px-4 sm:rounded-l-[10px] sm:rounded-r-none">
            <Search className="size-5 shrink-0 text-[#6460FF]" aria-hidden />
            <input
              id="home-search"
              type="search"
              placeholder="Tìm game thủ, trò chơi, rank…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="min-h-[44px] w-full bg-transparent text-[14px] text-[#280071] outline-none placeholder:text-[#999999]"
            />
          </div>
          <Button
            type="submit"
            variant="pdPrimary"
            className="min-h-[48px] shrink-0 rounded-[10px] px-8 sm:rounded-l-none sm:rounded-r-[10px]"
          >
            Tìm kiếm
          </Button>
        </form>

        <div className="relative z-10 mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-6 text-white/90 sm:justify-start">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-[#20AEFF]" aria-hidden />
            <span className="text-sm font-medium">
              <strong className="text-white">{data?.stats.totalPlayers ?? "—"}</strong> game thủ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="size-5 text-[#9975FF]" aria-hidden />
            <span className="text-sm font-medium">Voice / party</span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-[#59EA5B]" aria-hidden />
            <span className="text-sm font-medium">Chỉ duo đã duyệt</span>
          </div>
        </div>
      </section>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{loadError}</div>
      ) : null}

      <section aria-label="Trò chơi phổ biến">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#280071] sm:text-2xl">Chọn game</h2>
            <p className="mt-1 text-sm text-[#666666]">Lọc người cho thuê theo tựa game yêu thích.</p>
          </div>
          <Link
            to="/explore"
            className="pd-text-link flex items-center gap-0.5 font-semibold text-[#6460FF] no-underline hover:underline"
          >
            Khám phá tất cả
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-2 pt-1">
          {(data?.categories ?? []).slice(0, 12).map((c) => (
            <Link
              key={c.slug}
              to={`/explore/game/${c.slug}`}
              className="shrink-0 rounded-full border border-[#dcd6f5] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#280071] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#6460FF] hover:bg-[#F1EEFF] hover:shadow-md active:scale-[0.98]"
            >
              {c.label}
              <span className="ml-1 text-[11px] font-normal text-[#999999]">({c.playerCount})</span>
            </Link>
          ))}
          {!data?.categories?.length && !loadError ? (
            <p className="pd-text-body text-[#999999]">Đang tải danh mục...</p>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#280071] sm:text-2xl">Nổi bật</h2>
            <p className="mt-1 text-sm text-[#666666]">Người cho thuê được duyệt — uy tín &amp; đánh giá.</p>
          </div>
          <Link to="/explore" className="text-sm font-semibold text-[#6460FF] hover:underline">
            Xem toàn bộ →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col rounded-2xl border border-[#ebe8f5] bg-white p-5 shadow-[0_4px_20px_-8px_rgba(40,0,113,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c4b5fd] hover:shadow-[0_16px_40px_-16px_rgba(100,96,255,0.25)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="relative">
                  <div className="size-14 shrink-0 overflow-hidden rounded-[10px] border-2 border-white shadow-md">
                    {p.avatarUrl?.trim() ? (
                      <img src={p.avatarUrl.trim()} alt="" className="size-full object-cover" />
                    ) : (
                      <div className={`flex size-full items-center justify-center bg-gradient-to-br text-lg font-black text-white ${p.avatarClassName}`} aria-hidden>
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {p.online ? (
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-[#59EA5B]" title="Live / online" />
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-0.5 text-[#354052]">
                    <Star className="size-3.5 fill-[#FF731C] text-[#FF731C]" aria-hidden />
                    <span className="text-[13px] font-bold">{p.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-[#999999]">({p.reviewCount})</span>
                  </div>
                  {p.voiceOk !== false ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(32,174,255,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#0066CC]">
                      <Mic2 className="size-3" aria-hidden />
                      Voice
                    </span>
                  ) : null}
                </div>
              </div>

              <h3 className="pd-text-h3 mt-4 text-[#280071]">{p.name}</h3>
              <p className="pd-text-body mt-0.5 text-[#354052]">{p.game}</p>
              <p className="pd-text-caption mt-2 text-[#666666]">Rank · {p.rank}</p>

              <p className="pd-text-h3 mt-3 text-[#6460FF]">{formatVnd(p.pricePerHour)}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/players/${p.username}`} className={cn(buttonVariants({ variant: "pdPrimary" }), "min-h-10 flex-1 text-center sm:flex-none")}>
                  Xem hồ sơ
                </Link>
                <Link to="/explore" className={cn(buttonVariants({ variant: "pdSecondary" }), "min-h-10 flex-1 text-center sm:flex-none")}>
                  Khám phá
                </Link>
              </div>
            </article>
          ))}
          {!featured.length && data ? (
            <p className="pd-text-body text-[#666666] sm:col-span-2">
              Chưa có người cho thuê được duyệt — đăng ký, gửi đơn trở thành người cho thuê và chờ admin duyệt.
            </p>
          ) : null}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="rounded-2xl border border-[#e8e4f5] bg-white p-6 shadow-[0_4px_24px_-12px_rgba(100,96,255,0.12)] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">
                <MessageCircle className="size-4" aria-hidden />
                Nhắn tin nhanh
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-[#280071] sm:text-2xl">Chọn người cho thuê</h2>
              <p className="mt-1 text-sm text-[#666666]">Bấm avatar để mở hồ sơ — chat đầy đủ sắp ra mắt.</p>
            </div>
            <Link to="/explore" className="text-sm font-semibold text-[#6460FF] hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 sm:justify-start">
            {featured.slice(0, 12).map((p) => (
              <Link
                key={`msg-${p.id}`}
                to={`/players/${p.username}`}
                className="group flex flex-col items-center gap-2 rounded-2xl p-2 transition hover:bg-[#faf9ff]"
                title={p.name}
              >
                <div className="size-16 overflow-hidden rounded-full border-4 border-[#f1eeff] bg-gradient-to-br shadow-md transition group-hover:border-[#6460FF]/40 group-hover:shadow-lg sm:size-[72px]">
                  {p.avatarUrl?.trim() ? (
                    <img src={p.avatarUrl.trim()} alt="" className="size-full object-cover" />
                  ) : (
                    <div className={`flex size-full items-center justify-center bg-gradient-to-br text-xl font-black text-white ${p.avatarClassName}`}>
                      {p.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="max-w-[88px] truncate text-center text-[11px] font-semibold text-[#354052]">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-5 text-xl font-extrabold tracking-tight text-[#280071] sm:text-2xl">Trò chơi hot</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(data?.hotGames ?? []).map((g) => (
            <Link
              key={g.slug}
              to={`/explore/game/${g.slug}`}
              className={`relative overflow-hidden rounded-xl border border-[rgb(0_0_0_/_0.06)] bg-gradient-to-br ${HOT_TILE_GRADIENT[g.slug] ?? HOT_TILE_GRADIENT.default} p-5 transition-transform hover:scale-[1.02] hover:shadow-lg`}
            >
              <Gamepad2 className="mb-8 size-8 text-[#280071]/80" aria-hidden />
              <p className="pd-text-h3 text-[#280071]">{g.label}</p>
              <p className="pd-text-caption mt-1 text-[#354052]">{g.playerCount}+ người chơi liên quan</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#e8e4f5] bg-white px-6 py-12 shadow-[0_8px_40px_-20px_rgba(100,96,255,0.15)] sm:px-12">
        <h2 className="pd-text-h2 text-center text-[#280071]">Chơi cùng nhau trong 3 bước</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { step: "1", title: "Chọn game và lọc", desc: "Từ trang chủ hoặc /explore/game/… — lọc theo tài khoản thật.", icon: Search },
            { step: "2", title: "Xem hồ sơ công khai", desc: "Mỗi người có URL /players/username.", icon: Users },
            { step: "3", title: "Hồ sơ & thuê", desc: "Vào Hồ sơ để chỉnh thông tin; thuê nhanh từ trang người chơi.", icon: Handshake },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F1EEFF] text-[#6460FF] shadow-inner">
                <Icon className="size-7" aria-hidden />
              </div>
              <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-[#6460FF]">Bước {step}</p>
              <h3 className="pd-text-h3 mt-1 text-[#280071]">{title}</h3>
              <p className="pd-text-body mt-2 text-[#666666]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-[#6460FF] via-[#5b4bd4] to-[#7B19D8] px-6 py-12 text-center shadow-xl sm:flex-row sm:px-10 sm:text-left">
        <div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">Sẵn sàng leo rank?</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            Tạo tài khoản miễn phí — chỉnh hồ sơ và bắt đầu tìm duo trong vài phút.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/signup" className={cn(buttonVariants({ variant: "pdSecondary" }), "min-h-12 border-0 bg-white font-bold text-[#280071] shadow-md hover:bg-[#faf9ff]")}>
            Đăng ký
          </Link>
          <Link
            to="/signin"
            className="inline-flex min-h-11 min-w-[120px] items-center justify-center rounded-[8px] border border-white/35 px-5 text-[14px] font-semibold leading-[21px] tracking-[0.5px] text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Đăng nhập
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
