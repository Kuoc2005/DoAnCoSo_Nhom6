import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useParams, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { PlayerListingCard } from "@/components/playerduo/PlayerListingCard";
import { MatchSuggestions } from "@/components/match/MatchSuggestions";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import type { ListingsResponse, ListingCardPayload } from "@/types/catalog";

const PAGE_SIZE = 12;

const GAME_FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "lol", label: "Liên Minh" },
  { id: "valorant", label: "Valorant" },
  { id: "pubgm", label: "PUBG Mobile" },
  { id: "freefire", label: "Free Fire" },
  { id: "cs2", label: "CS2" },
] as const;

const ExplorePage = () => {
  const { gameSlug } = useParams<{ gameSlug?: string }>();
  const [params, setParams] = useSearchParams();
  const gameId = params.get("game") ?? "all";

  const [listings, setListings] = useState<ListingCardPayload[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const filterKey = useMemo(() => {
    const g = params.get("game") ?? "all";
    const q = (params.get("q") ?? "").trim();
    return `${gameSlug ?? ""}|${g}|${q}`;
  }, [params, gameSlug]);

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    if (!gameSlug) return;
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get("game") === gameSlug) return prev;
      next.set("game", gameSlug);
      return next;
    }, { replace: true });
  }, [gameSlug, setParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchErr(null);
    const qs = new URLSearchParams();
    const g = params.get("game");
    const q = params.get("q");
    if (g && g !== "all") qs.set("game", g);
    if (q?.trim()) qs.set("q", q.trim());
    qs.set("page", String(page));
    qs.set("pageSize", String(PAGE_SIZE));

    fetch(getApiUrl(`/api/listings?${qs.toString()}`))
      .then(async (res) => {
        if (!res.ok) throw new Error("Không tải được danh sách.");
        return res.json() as Promise<ListingsResponse>;
      })
      .then((d) => {
        if (!cancelled) {
          const tp = Math.max(1, d.totalPages ?? 1);
          const safePage = page > tp ? tp : page;
          setListings(d.listings ?? []);
          setTotal(typeof d.total === "number" ? d.total : d.listings?.length ?? 0);
          setTotalPages(tp);
          if (safePage !== page) setPage(safePage);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchErr("Không kết nối được API danh sách.");
          setListings([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params, page, gameSlug]);

  const fromIdx = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toIdx = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <div className="content-playerduo space-y-8 pb-12">
      <section className="rounded-2xl border border-black/[0.06] bg-white px-6 py-8 shadow-[0_4px_28px_-16px_rgba(40,0,113,0.18)] sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">Khám phá</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#280071] sm:text-4xl">Tìm đồng đội</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#666666]">
              Lọc theo game
              <code className="rounded bg-[#F1EEFF] px-1.5 py-0.5 text-[13px] text-[#6460FF]">Tìm bạn Duo</code>.
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 rounded-full border border-[#e8e4f5] bg-[#faf9ff] px-4 py-2 text-sm font-semibold text-[#280071] hover:bg-[#F1EEFF]"
          >
            Về trang chủ
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-6">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EEFF] px-3 py-1.5 text-xs font-semibold text-[#6460FF]">
            <Filter className="size-3.5" aria-hidden />
            Lọc game
          </span>
          <nav className="flex flex-wrap gap-2">
            {GAME_FILTERS.map((g) => (
              <NavLink
                key={g.id}
                to={g.id === "all" ? "/explore" : `/explore/game/${g.id}`}
                end={g.id === "all"}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[#6460FF] text-white shadow-[0_4px_14px_-6px_rgba(100,96,255,0.65)]"
                      : "border border-[#e8e4f5] bg-white text-[#354052] hover:border-[#6460FF]/40 hover:bg-[#faf9ff]"
                  )
                }
              >
                {g.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <p className="mt-4 text-sm text-[#666666]">
          {loading ? "…" : `${fromIdx}–${toIdx} / ${total} người chơi`}
          {gameId !== "all" ? ` · ${GAME_FILTERS.find((g) => g.id === gameId)?.label ?? ""}` : ""}
          {!loading && totalPages > 1 ? ` · Trang ${page}/${totalPages}` : ""}
        </p>
      </section>

      <MatchSuggestions />

      <div className="space-y-5">
        {fetchErr ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{fetchErr}</div>
        ) : null}

        {loading ? (
          <p className="pd-text-body text-[#666666]">Đang tải danh sách...</p>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white px-8 py-14 text-center shadow-inner">
            <p className="pd-text-body-lg font-semibold text-[#354052]">{total === 0 ? "Chưa có kết quả" : "Trang này trống"}</p>
            <p className="mt-2 pd-text-body text-[#666666]">
              {total === 0 ? "Thử chọn game khác hoặc \"Tất cả\"." : "Quay lại trang đầu hoặc đổi bộ lọc."}
            </p>
            {total > 0 ? (
              <button
                type="button"
                onClick={() => setPage(1)}
                className="mt-6 inline-block rounded-full bg-[#6460FF] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#5550DD]"
              >
                Về trang 1
              </button>
            ) : (
              <Link
                to="/explore"
                className="mt-8 inline-block rounded-full bg-[#6460FF] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#5550DD]"
              >
                Xem tất cả
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((card) => (
                <PlayerListingCard
                  key={card.id}
                  id={card.id}
                  username={card.username}
                  name={card.name}
                  game={card.game}
                  rank={card.rank}
                  pricePerHour={card.pricePerHour}
                  rating={card.rating}
                  reviewCount={card.reviewCount}
                  online={card.online}
                  badge={card.badge}
                  avatarClassName={card.avatarClassName}
                  avatarUrl={card.avatarUrl}
                  voiceOk={card.voiceOk}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav className="flex flex-wrap items-center justify-center gap-2 pt-4" aria-label="Phân trang">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-[#e8e4f5] bg-white px-4 py-2 text-sm font-semibold text-[#280071] shadow-sm transition hover:border-[#6460FF]/40 disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Trước
                </button>
                <span className="px-2 text-sm text-[#666666]">
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-[#e8e4f5] bg-white px-4 py-2 text-sm font-semibold text-[#280071] shadow-sm transition hover:border-[#6460FF]/40 disabled:opacity-40"
                >
                  Sau
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
