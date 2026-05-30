import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MessageCircle, Star, TrendingUp, Trophy, Wallet } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ListingCardPayload } from "@/types/catalog";

type RankUser = {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  totalTopUpVnd?: number;
  totalSpendVnd?: number;
  totalEarnedVnd?: number;
  bookingCount?: number;
  game?: string;
  listingCoverUrl?: string;
  featuredGameSlug?: string;
};

type RatedProvider = ListingCardPayload & {
  rank: number;
  leaderboardScore: number;
};

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.floor(n)));
}

function Avatar({ name, username, avatarUrl, className }: { name: string; username: string; avatarUrl?: string; className?: string }) {
  const url = avatarUrl?.trim();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-[#6460FF] to-[#7B19D8] text-sm font-bold text-white shadow-sm",
        className
      )}
    >
      {url ? <img src={url} alt="" className="size-full object-cover" /> : (name || username).slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const [topTopUp, setTopTopUp] = useState<RankUser[]>([]);
  const [topRenters, setTopRenters] = useState<RankUser[]>([]);
  const [topProviders, setTopProviders] = useState<RankUser[]>([]);
  const [topRated, setTopRated] = useState<RatedProvider[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(getApiUrl("/api/listings/leaderboards?limit=15"))
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(typeof j.message === "string" ? j.message : res.statusText);
        }
        return res.json() as Promise<{
          topTopUp: RankUser[];
          topRenters: RankUser[];
          topProviderEarners: RankUser[];
          topRatedProviders: RatedProvider[];
        }>;
      })
      .then((d) => {
        if (!cancelled) {
          setTopTopUp(d.topTopUp ?? []);
          setTopRenters(d.topRenters ?? []);
          setTopProviders(d.topProviderEarners ?? []);
          setTopRated(d.topRatedProviders ?? []);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lỗi.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function tableBlock(
    title: string,
    subtitle: string,
    icon: typeof Trophy,
    rows: RankUser[],
    valueKey: "totalTopUpVnd" | "totalSpendVnd" | "totalEarnedVnd",
    valueLabel: string,
    emptyColSpan: number,
    showGame = false
  ) {
    const Icon = icon;
    return (
      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-12px_rgba(40,0,113,0.12)]">
        <div className="border-b border-black/[0.06] bg-gradient-to-r from-[#faf9ff] to-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Icon className="size-6 text-[#6460FF]" aria-hidden />
            <h2 className="text-lg font-extrabold text-[#280071]">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-[#666666]">{subtitle}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa] text-xs font-bold uppercase tracking-wide text-[#999999]">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Người chơi</th>
                {showGame ? <th className="px-4 py-3">Game nổi bật</th> : null}
                <th className="px-4 py-3 text-right">{valueLabel}</th>
                {valueKey !== "totalTopUpVnd" ? <th className="px-4 py-3 text-right">Lượt</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={emptyColSpan + (showGame ? 1 : 0)} className="px-4 py-8 text-center text-[#999999]">
                    Chưa có dữ liệu — hãy nạp tiền hoặc thuê để xuất hiện trên bảng.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${title}-${r.username}`} className="border-b border-black/[0.04] last:border-0 hover:bg-[#faf9ff]/80">
                    <td className="px-4 py-3 font-bold text-[#6460FF]">{r.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.displayName} username={r.username} avatarUrl={r.avatarUrl} className="size-10" />
                        <div>
                          <Link className="font-semibold text-[#280071] hover:text-[#6460FF]" to={`/players/${r.username}`}>
                            {r.displayName}
                          </Link>
                          <div className="font-mono text-xs text-[#999999]">@{r.username}</div>
                        </div>
                      </div>
                    </td>
                    {showGame ? (
                      <td className="px-4 py-3 text-[#354052]">
                        <div className="flex items-center gap-2">
                          {r.listingCoverUrl ? (
                            <img src={r.listingCoverUrl} alt="" className="size-8 rounded-md object-cover ring-1 ring-black/10" />
                          ) : null}
                          <span className="text-xs font-medium">{r.game ?? "—"}</span>
                        </div>
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#354052]">
                      {formatVnd(Number(r[valueKey]) || 0)} ₫
                    </td>
                    {valueKey !== "totalTopUpVnd" ? (
                      <td className="px-4 py-3 text-right text-[#666666]">{r.bookingCount ?? "—"}</td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="content-playerduo space-y-8 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#280071] sm:text-3xl">
          <Trophy className="size-8 text-[#FFB800]" aria-hidden />
          Bảng xếp hạng
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#666666]">
        </p>
      </div>

      {error ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-12px_rgba(40,0,113,0.12)]">
        <div className="border-b border-black/[0.06] bg-gradient-to-r from-[#faf9ff] to-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Star className="size-6 text-[#FFB800]" aria-hidden />
            <h2 className="text-lg font-extrabold text-[#280071]">Provider uy tín nhất</h2>
          </div>
          <p className="mt-1 text-sm text-[#666666]">Điểm rating.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa] text-xs font-bold uppercase tracking-wide text-[#999999]">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Game nổi bật</th>
                <th className="px-4 py-3 text-right">Điểm</th>
                <th className="px-4 py-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {topRated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#999999]">
                    Chưa có dữ liệu provider.
                  </td>
                </tr>
              ) : (
                topRated.map((r) => (
                  <tr key={`rated-${r.username}`} className="border-b border-black/[0.04] last:border-0 hover:bg-[#faf9ff]/80">
                    <td className="px-4 py-3 font-bold text-[#6460FF]">{r.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} username={r.username} avatarUrl={r.avatarUrl} className="size-10" />
                        <div>
                          <Link className="font-semibold text-[#280071] hover:text-[#6460FF]" to={`/players/${r.username}`}>
                            {r.name}
                          </Link>
                          <div className="font-mono text-xs text-[#999999]">@{r.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.listingCoverUrl ? (
                          <img src={r.listingCoverUrl} alt="" className="h-9 w-16 rounded-md object-cover ring-1 ring-black/10" />
                        ) : null}
                        <span className="text-xs font-medium text-[#354052]">{r.game}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[#6460FF]">{r.leaderboardScore.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#354052]">
                      {r.rating.toFixed(1)} ({r.reviewCount})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {tableBlock(
          "Nạp tiền nhiều nhất",
          "Tổng đã nạp vào ví (demo, cộng dồn mỗi lần nạp).",
          Wallet,
          topTopUp,
          "totalTopUpVnd",
          "Đã nạp",
          3
        )}
        {tableBlock(
          "Thuê nhiều nhất",
          "Tổng giá trị booking với vai trò người thuê.",
          MessageCircle,
          topRenters,
          "totalSpendVnd",
          "Đã chi",
          4
        )}
      </div>

      {tableBlock(
        "Người cho thuê kiếm nhiều nhất",
        "Tổng tiền về ví sau phí nền tảng — chỉ provider còn quyền. Game nổi bật theo thuê/chơi.",
        TrendingUp,
        topProviders,
        "totalEarnedVnd",
        "Thu nhập",
        5,
        true
      )}
    </div>
  );
}
