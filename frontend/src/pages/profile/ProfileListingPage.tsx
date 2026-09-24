import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, getApiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { GameTaxonomyItem } from "@/types/match";

export default function ProfileListingPage() {
  const { user, ready, refreshUser } = useAuth();
  const [taxonomy, setTaxonomy] = useState<GameTaxonomyItem[]>([]);
  const [pricePerHour, setPricePerHour] = useState(55000);
  const [rankLabel, setRankLabel] = useState("");
  const [primaryGameSlug, setPrimaryGameSlug] = useState("valorant");
  const [voiceOk, setVoiceOk] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(getApiUrl("/api/match/taxonomy"))
      .then((r) => r.json())
      .then((d: { games: GameTaxonomyItem[] }) => setTaxonomy(d.games ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pl = user?.playerListing;
    if (!pl) return;
    setPricePerHour(pl.pricePerHour ?? 55000);
    setRankLabel(pl.rankLabel ?? "");
    setPrimaryGameSlug(pl.primaryGameSlug ?? "valorant");
    setVoiceOk(pl.voiceOk !== false);
    setIsLive(Boolean(pl.isLive));
  }, [user?._id, user?.playerListing]);

  if (!ready) return <p className="pd-text-body text-[#666666]">Đang tải...</p>;

  if (!user) {
    return (
      <div className="pd-card-default text-center">
        <p className="pd-text-body text-[#354052]">Đăng nhập để chỉnh thẻ duo.</p>
        <Link to="/signin" className="mt-4 inline-block font-semibold text-[#6460FF] underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (user.accountType === "provider") {
    return <Navigate to="/profile/provider-studio" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/api/user/player-listing", {
        method: "PATCH",
        body: JSON.stringify({
          pricePerHour,
          rankLabel,
          primaryGameSlug,
          voiceOk,
          isLive,
        }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof err.message === "string" ? err.message : "Lỗi lưu.");
      toast.success("Đã cập nhật thẻ duo.");
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="pd-card-default">
        <h2 className="pd-text-h2 text-[#354052]">Hiển thị trên Khám phá</h2>
        <p className="pd-text-body-sm mt-2 text-[#666666]">
          Dữ liệu đồng bộ với API <span className="text-code">GET /api/listings</span> — người khác xem qua thẻ và{" "}
          <Link className="font-semibold text-[#6460FF]" to={`/players/${user.username}`}>
            /players/{user.username}
          </Link>
          .
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="pl-price" className="pd-text-label mb-2 block text-[#354052]">
              Giá / giờ (VNĐ)
            </label>
            <input
              id="pl-price"
              type="number"
              min={0}
              className="pd-input-field w-full"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label htmlFor="pl-rank" className="pd-text-label mb-2 block text-[#354052]">
              Rank hiển thị
            </label>
            <input
              id="pl-rank"
              className="pd-input-field w-full"
              value={rankLabel}
              onChange={(e) => setRankLabel(e.target.value)}
              placeholder="vd: Immortal 2"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="pl-game" className="pd-text-label mb-2 block text-[#354052]">
              Game chính
            </label>
            <select
              id="pl-game"
              className="pd-input-field w-full max-w-md"
              value={primaryGameSlug}
              onChange={(e) => setPrimaryGameSlug(e.target.value)}
            >
              {taxonomy.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 pd-text-body text-[#354052]">
            <input type="checkbox" className="size-5 accent-[#6460FF]" checked={voiceOk} onChange={(e) => setVoiceOk(e.target.checked)} />
            Chơi voice / party
          </label>
          <label className="flex cursor-pointer items-center gap-3 pd-text-body text-[#354052]">
            <input type="checkbox" className="size-5 accent-[#6460FF]" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} />
            Hiển thị trạng thái live
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="submit" variant="pdPrimary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thẻ duo"}
          </Button>
          <Button type="button" variant="pdSecondary" render={<Link to="/explore" />}>
            Xem trên Khám phá
          </Button>
        </div>
      </div>
    </form>
  );
}
