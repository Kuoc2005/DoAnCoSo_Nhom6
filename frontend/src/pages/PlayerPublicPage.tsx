import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Gamepad2, MessageCircle, Share2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { getApiUrl, apiFetch } from "@/lib/api";
import { gameLabel } from "@/lib/gameCatalog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type PublicPlayer = {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  accountType?: string;
  avatarUrl?: string;
  listingCoverUrl?: string;
  primaryGameLabel: string;
  featuredGameSlug?: string;
  avatarClassName: string;
  gameSlugs: string[];
  rentableGames?: { slug: string; label: string }[];
  playerListing?: {
    pricePerHour?: number;
    rankLabel?: string;
    ratingAvg?: number;
    reviewCount?: number;
    voiceOk?: boolean;
    isLive?: boolean;
    isVerifiedProvider?: boolean;
    listingCoverUrl?: string;
  };
  gamingProfile?: {
    favoriteSlugs?: string[];
    playHistory?: { gameSlug: string; hoursPlayed?: number }[];
  };
};

type ReviewRow = {
  id: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  author: { username: string; displayName?: string } | null;
};

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function PlayerPublicPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [player, setPlayer] = useState<PublicPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const [rentHours, setRentHours] = useState("1");
  const [rentGameSlug, setRentGameSlug] = useState("");
  const [rentLoading, setRentLoading] = useState(false);

  function reloadPlayer() {
    if (!username) return;
    fetch(getApiUrl(`/api/players/${encodeURIComponent(username)}`))
      .then(async (res) => {
        if (!res.ok) return;
        const d = (await res.json()) as { player: PublicPlayer };
        setPlayer(d.player);
      })
      .catch(() => { });
  }

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setError(null);
    fetch(getApiUrl(`/api/players/${encodeURIComponent(username)}`))
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(typeof j.message === "string" ? j.message : "Không tìm thấy.");
        }
        return res.json() as Promise<{ player: PublicPlayer }>;
      })
      .then((d) => {
        if (!cancelled) setPlayer(d.player);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lỗi.");
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    fetch(getApiUrl(`/api/reviews/player/${encodeURIComponent(username)}`))
      .then(async (res) => {
        if (!res.ok) return;
        const d = (await res.json()) as { reviews: ReviewRow[] };
        if (!cancelled) setReviewRows(d.reviews ?? []);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (error) {
    return (
      <div className="content-playerduo py-16 text-center">
        <p className="pd-text-body-lg font-semibold text-[#354052]">{error}</p>
        <Link to="/explore" className="mt-6 inline-block font-semibold text-[#6460FF] underline">
          Về khám phá
        </Link>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="content-playerduo py-16">
        <p className="pd-text-body text-[#666666]">Đang tải hồ sơ...</p>
      </div>
    );
  }

  const pl = player.playerListing ?? {};
  const rating = pl.ratingAvg ?? 4.5;
  const reviewTotal = pl.reviewCount ?? 0;
  const canReview = Boolean(user && user.username !== player.username);
  const coverUrl = player.listingCoverUrl?.trim() || pl.listingCoverUrl?.trim();
  const isHirable = player.accountType === "provider";
  const price = pl.pricePerHour ?? 55000;
  const rentableGames =
    player.rentableGames?.length
      ? player.rentableGames
      : player.gameSlugs.map((slug) => ({ slug, label: gameLabel(slug) }));

  function openRentModal() {
    const defaultSlug =
      player.featuredGameSlug?.trim() ||
      player.gameSlugs[0] ||
      rentableGames[0]?.slug ||
      "valorant";
    setRentGameSlug(defaultSlug);
    setRentOpen(true);
  }

  async function submitQuickRent() {
    if (!user || !player || !isHirable) return;
    const h = Number(rentHours);
    if (!Number.isFinite(h) || h < 0.25) {
      toast.error("Số giờ tối thiểu 0.25.");
      return;
    }
    if (!rentGameSlug.trim()) {
      toast.error("Vui lòng chọn game muốn thuê.");
      return;
    }
    setRentLoading(true);
    try {
      const res = await apiFetch("/api/rentals/quick", {
        method: "POST",
        body: JSON.stringify({
          providerUsername: player.username,
          hours: h,
          gameSlug: rentGameSlug,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j.message === "string" ? j.message : "Thuê thất bại.");
      }
      toast.success(`Đã đặt thuê ${gameLabel(rentGameSlug)} — số dư ví đã được trừ.`);
      setRentOpen(false);
      await refreshUser();
      reloadPlayer();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setRentLoading(false);
    }
  }

  async function submitReview() {
    if (!canReview || !player) return;
    setSubmittingReview(true);
    try {
      const res = await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          targetUsername: player.username,
          rating: formRating,
          comment: formComment.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j.message === "string" ? j.message : "Không gửi được đánh giá.");
      }
      toast.success("Đã lưu đánh giá.");
      setFormComment("");
      reloadPlayer();
      const r = await fetch(getApiUrl(`/api/reviews/player/${encodeURIComponent(player.username)}`));
      if (r.ok) {
        const d = (await r.json()) as { reviews: ReviewRow[] };
        setReviewRows(d.reviews ?? []);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="min-w-0 bg-[#ece8f4] pb-20">
      <div className="content-playerduo max-w-[920px] px-3 sm:px-4">
        <Link
          to="/explore"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-[#354052] shadow-sm ring-1 ring-black/[0.06] backdrop-blur-sm transition hover:bg-white hover:text-[#280071]"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Khám phá
        </Link>

        {/* Cover — kiểu banner hồ sơ Player Duo */}
        <div className="relative overflow-hidden rounded-[1.25rem] shadow-[0_12px_40px_-12px_rgba(40,0,113,0.25)] sm:rounded-[1.5rem]">
          <div className="relative aspect-[21/9] min-h-[140px] sm:min-h-[200px]">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#5b4bdb] via-[#7B19D8] to-[#c4a8ff]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-80 sm:hidden" aria-hidden />
          </div>
        </div>

        {/* Thẻ trắng chồng lên cover */}
        <div className="relative z-10 -mt-14 sm:-mt-20">
          <div className="rounded-[1.25rem] border border-white/80 bg-white/95 p-5 shadow-[0_16px_48px_-20px_rgba(100,96,255,0.35)] backdrop-blur-md sm:rounded-[1.5rem] sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
                <div className="-mt-20 flex shrink-0 justify-center sm:-mt-24">
                  <div className="relative">
                    <div className="size-28 overflow-hidden rounded-full border-[4px] border-white bg-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] ring-2 ring-[#6460FF]/20 sm:size-36 sm:border-[5px]">
                      {player.avatarUrl?.trim() ? (
                        <img src={player.avatarUrl.trim()} alt="" className="size-full object-cover" />
                      ) : (
                        <div
                          className={cn(
                            "flex size-full items-center justify-center bg-gradient-to-br text-3xl font-black text-white/90 sm:text-4xl",
                            player.avatarClassName || "from-[#280071] to-[#6460FF]"
                          )}
                          role="img"
                          aria-label={player.displayName}
                        >
                          {player.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {pl.isLive ? (
                      <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full border-2 border-white bg-[#59EA5B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d3d0f] shadow-sm">
                        Live
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0 flex-1 text-center sm:pt-2 sm:text-left">
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#280071] sm:text-3xl">{player.displayName}</h1>
                  <p className="mt-1 font-mono text-sm text-[#888888]">@{player.username}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#F1EEFF] px-3 py-1 text-xs font-semibold text-[#6460FF]">
                    <Gamepad2 className="size-3.5 shrink-0" aria-hidden />
                    {player.primaryGameLabel}
                    {pl.rankLabel?.trim() ? (
                      <>
                        <span className="text-[#cccccc]" aria-hidden>
                          ·
                        </span>
                        <span className="text-[#354052]">{pl.rankLabel.trim()}</span>
                      </>
                    ) : null}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E6] px-3 py-1 text-[13px] font-bold text-[#8a6d00]">
                      <Star className="size-3.5 fill-[#FFB800] text-[#FFB800]" aria-hidden />
                      {rating.toFixed(1)}
                      <span className="font-semibold text-[#b89b00]">({reviewTotal})</span>
                    </span>
                    {pl.voiceOk !== false ? (
                      <span className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] font-semibold text-[#354052]">
                        Voice OK
                      </span>
                    ) : null}
                    {pl.isVerifiedProvider ? (
                      <span className="rounded-full bg-[#6460FF] px-3 py-1 text-[12px] font-bold text-white shadow-sm">Đã xác minh</span>
                    ) : null}
                    {isHirable ? (
                      <span className="rounded-full border border-[#59EA5B]/50 bg-[#ecfdf3] px-3 py-1 text-[12px] font-bold text-[#166534]">
                        Nhận thuê
                      </span>
                    ) : (
                      <span className="rounded-full bg-black/[0.05] px-3 py-1 text-[12px] font-semibold text-[#666666]">Chưa mở thuê</span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {user && user.username !== player.username ? (
                      <Button
                        variant="pdSecondary"
                        type="button"
                        className="min-h-11"
                        onClick={() => navigate(`/messages?with=${encodeURIComponent(player.username)}`)}
                      >
                        <MessageCircle className="mr-2 size-4" />
                        Nhắn tin
                      </Button>
                    ) : !user ? (
                      <Button variant="pdSecondary" type="button" className="min-h-11" render={<Link to="/signin" state={{ from: `/players/${player.username}` }} />}>
                        <MessageCircle className="mr-2 size-4" />
                        Nhắn tin
                      </Button>
                    ) : null}
                    <Button variant="pdGhost" type="button" aria-label="Chia sẻ" className="min-h-11 px-4">
                      <Share2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cột phải: thẻ giá — giống khối booking Player Duo */}
              <div className="w-full shrink-0 lg:max-w-[280px] lg:pt-1">
                <div className="rounded-2xl bg-gradient-to-br from-[#6460FF] via-[#5b52e0] to-[#4a3fcc] p-[1px] shadow-[0_12px_32px_-8px_rgba(100,96,255,0.55)]">
                  <div className="rounded-[0.9375rem] bg-gradient-to-b from-white/12 to-transparent p-5 text-white">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">Giá thuê</p>
                    <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                      {formatVnd(price)}
                      <span className="ml-1 text-base font-bold text-white/85">₫/giờ</span>
                    </p>
                    {isHirable ? (
                      <Button
                        variant="pdSecondary"
                        type="button"
                        className="mt-5 w-full min-h-12 border-0 bg-white font-bold text-[#280071] shadow-md hover:bg-[#faf9ff]"
                        onClick={openRentModal}
                      >
                        Thuê ngay
                      </Button>
                    ) : (
                      <Button variant="pdSecondary" type="button" className="mt-5 w-full min-h-12 opacity-80" disabled>
                        Chưa mở thuê công khai
                      </Button>
                    )}
                    <p className="mt-3 text-center text-[11px] leading-relaxed text-white/75">Thanh toán an toàn qua ví Player Duo (demo).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung dưới */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm lg:col-span-2 sm:p-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">Giới thiệu</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[#354052]">
              {player.bio?.trim() || "Người chơi chưa cập nhật giới thiệu."}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-gradient-to-b from-[#faf9ff] to-white p-6 shadow-sm sm:p-8">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#280071]">
              <Gamepad2 className="size-4 text-[#6460FF]" aria-hidden />
              Game &amp; sở thích
            </h3>
            <p className="mt-3 text-sm text-[#666666]">
              Game nổi bật: <strong className="text-[#354052]">{player.primaryGameLabel}</strong>
            </p>
            {rentableGames.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {rentableGames.map((g) => (
                  <li key={g.slug}>
                    <Link
                      className="inline-block rounded-full bg-[#F1EEFF] px-3 py-1 text-xs font-semibold text-[#6460FF] hover:bg-[#e8e4ff]"
                      to={`/explore/game/${g.slug}`}
                    >
                      {g.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-4 space-y-2 text-sm text-[#666666]">
              {(player.gamingProfile?.favoriteSlugs ?? []).slice(0, 10).map((s) => (
                <li key={s}>
                  <Link className="font-medium text-[#6460FF] hover:underline" to={`/explore/game/${s}`}>
                    #{s}
                  </Link>
                </li>
              ))}
              {(player.gamingProfile?.favoriteSlugs ?? []).length === 0 ? <li className="text-[#999999]">Chưa công khai.</li> : null}
            </ul>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">Đánh giá</h2>
          <ul className="mt-5 space-y-5">
            {reviewRows.length === 0 ? (
              <li className="text-sm text-[#666666]">Chưa có đánh giá từ người thuê.</li>
            ) : (
              reviewRows.map((r) => (
                <li key={r.id} className="border-b border-black/[0.06] pb-5 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 text-sm font-bold text-[#354052]">
                      <Star className="size-4 fill-[#FFB800] text-[#FFB800]" aria-hidden />
                      {r.rating}/5
                    </span>
                    <span className="text-xs text-[#999999]">
                      {r.author?.displayName || r.author?.username || "Ẩn danh"}
                      {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleString("vi-VN")}` : null}
                    </span>
                  </div>
                  {r.comment?.trim() ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#354052]">{r.comment.trim()}</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>

          {canReview ? (
            <div className="mt-8 border-t border-black/[0.06] pt-8">
              <h3 className="text-sm font-bold text-[#280071]">Viết đánh giá</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label htmlFor="review-stars" className="text-xs text-[#666666]">
                  Điểm
                </label>
                <select
                  id="review-stars"
                  className="rounded-lg border border-black/[0.1] bg-white px-2 py-2 text-sm text-[#354052]"
                  value={formRating}
                  onChange={(e) => setFormRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} sao
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="mt-3 w-full rounded-xl border border-black/[0.1] bg-[#fafafa] px-3 py-2.5 text-sm text-[#354052] outline-none transition focus:border-[#6460FF] focus:ring-2 focus:ring-[#6460FF]/20"
                rows={3}
                maxLength={600}
                placeholder="Chia sẻ trải nghiệm khi chơi cùng..."
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
              />
              <Button className="mt-3" variant="pdPrimary" type="button" disabled={submittingReview} onClick={() => void submitReview()}>
                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
            </div>
          ) : user ? (
            <p className="mt-8 border-t border-black/[0.06] pt-6 text-xs text-[#999999]">Bạn không thể đánh giá chính mình.</p>
          ) : (
            <p className="mt-8 border-t border-black/[0.06] pt-6 text-xs text-[#999999]">
              <Link className="font-semibold text-[#6460FF] underline" to="/signin">
                Đăng nhập
              </Link>{" "}
              để đánh giá sau khi thuê.
            </p>
          )}
        </section>

        <p className="mt-10 text-center text-[11px] text-[#999999]">
          Hồ sơ công khai · <code className="rounded bg-white/80 px-1.5 py-0.5 text-[10px]">{player.username}</code>
        </p>
      </div>

      {rentOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="pd-text-h2 text-[#280071]">Thuê nhanh</h2>
              <button type="button" className="rounded-lg p-2 text-[#666666] hover:bg-black/[0.05]" aria-label="Đóng" onClick={() => setRentOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <p className="pd-text-body-sm mt-2 text-[#666666]">
              Giá: <strong>{formatVnd(price)} ₫/giờ</strong>. Thanh toán từ ví (phí nền tảng 15% đã trừ vào giá trị giao dịch).
            </p>
            {!user ? (
              <p className="mt-4 pd-text-body text-[#354052]">
                <Link className="font-semibold text-[#6460FF] underline" to="/signin">
                  Đăng nhập
                </Link>{" "}
                để thuê.
              </p>
            ) : (
              <>
                <label htmlFor="rent-game" className="pd-text-label mt-4 block text-[#354052]">
                  Game muốn thuê
                </label>
                <select
                  id="rent-game"
                  className="pd-input-field mt-2 w-full"
                  value={rentGameSlug}
                  onChange={(e) => setRentGameSlug(e.target.value)}
                >
                  {rentableGames.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <label htmlFor="rent-h" className="pd-text-label mt-4 block text-[#354052]">
                  Số giờ
                </label>
                <input
                  id="rent-h"
                  type="number"
                  step="0.25"
                  min="0.25"
                  className="pd-input-field mt-2 w-full"
                  value={rentHours}
                  onChange={(e) => setRentHours(e.target.value)}
                />
                <p className="pd-text-caption mt-2 text-[#999999]">
                  Ước tính:{" "}
                  <strong className="text-[#354052]">{formatVnd(Math.round(Number(rentHours || 0) * price))} ₫</strong>
                  {" "}
                  · Số dư ví:{" "}
                  <strong className="text-[#354052]">{formatVnd(user.walletBalanceVnd ?? 0)} ₫</strong>
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button variant="pdPrimary" type="button" disabled={rentLoading} onClick={() => void submitQuickRent()}>
                    {rentLoading ? "Đang xử lý..." : "Xác nhận thuê"}
                  </Button>
                  <Link to="/profile/wallet" className={cn(buttonVariants({ variant: "pdGhost" }))}>
                    Nạp tiền
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
