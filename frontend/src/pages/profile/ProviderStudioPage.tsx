import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, getApiUrl } from "@/lib/api";
import { gameLabel } from "@/lib/gameCatalog";
import { useAuth } from "@/contexts/AuthContext";
import type { GameTaxonomyItem } from "@/types/match";

export default function ProviderStudioPage() {
  const { user, ready, refreshUser } = useAuth();
  const [taxonomy, setTaxonomy] = useState<GameTaxonomyItem[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pricePerHour, setPricePerHour] = useState(55000);
  const [rankLabel, setRankLabel] = useState("");
  const [voiceOk, setVoiceOk] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [saving, setSaving] = useState(false);

  const featuredGameSlug =
    (user?.playerListing as { featuredGameSlug?: string } | undefined)?.featuredGameSlug?.trim() ||
    user?.playerListing?.primaryGameSlug?.trim() ||
    "valorant";

  useEffect(() => {
    fetch(getApiUrl("/api/match/taxonomy"))
      .then((r) => r.json())
      .then((d: { games: GameTaxonomyItem[] }) => setTaxonomy(d.games ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setAvatarUrl(user.avatarUrl?.trim() ?? "");
    const pl = user.playerListing;
    setPricePerHour(pl?.pricePerHour ?? 55000);
    setRankLabel(pl?.rankLabel ?? "");
    setVoiceOk(pl?.voiceOk !== false);
    setIsLive(Boolean(pl?.isLive));
  }, [user?._id, user?.playerListing, user?.avatarUrl]);

  const coverPreviewUrl = useMemo(() => {
    const row = taxonomy.find((g) => g.slug === featuredGameSlug);
    return row?.coverUrl?.trim() ?? "";
  }, [taxonomy, featuredGameSlug]);

  if (!ready) return <p className="pd-text-body text-[#666666]">Đang tải...</p>;
  if (!user) {
    return (
      <div className="pd-card-default text-center">
        <p className="pd-text-body text-[#354052]">Đăng nhập để chỉnh studio.</p>
        <Link to="/signin" className="mt-4 inline-block font-semibold text-[#6460FF] underline">
          Đăng nhập
        </Link>
      </div>
    );
  }
  if (user.accountType !== "provider" && user.role !== "admin") {
    return <Navigate to="/profile/become-provider" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/api/user/provider-studio", {
        method: "PATCH",
        body: JSON.stringify({
          avatarUrl: avatarUrl.trim(),
          pricePerHour,
          rankLabel,
          voiceOk,
          isLive,
        }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof err.message === "string" ? err.message : "Lỗi lưu.");
      toast.success("Đã cập nhật hồ sơ cho thuê.");
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="pd-card-default">
        <h2 className="pd-text-h2 text-[#354052]">Studio người cho thuê</h2>
        <p className="pd-text-body-sm mt-2 text-[#666666]">
          Ảnh bìa và game hiển thị <strong>tự động</strong>: ưu tiên game được thuê nhiều nhất, sau đó game bạn chơi
          nhiều giờ nhất (cập nhật trong{" "}
          <Link className="font-semibold text-[#6460FF]" to="/profile/gaming">
            Hồ sơ gaming
          </Link>
          ).
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="ps-avatar" className="pd-text-label mb-2 block text-[#354052]">
              URL ảnh đại diện (CDN / imgur…)
            </label>
            <input
              id="ps-avatar"
              className="pd-input-field w-full"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <p className="pd-text-label mb-2 text-[#354052]">Game &amp; ảnh bìa hiện tại (tự động)</p>
            <div className="overflow-hidden rounded-xl border border-black/[0.08] shadow-sm">
              <div className="relative aspect-[21/9] min-h-[120px] bg-gradient-to-br from-[#5b4bdb] to-[#7B19D8]">
                {coverPreviewUrl ? (
                  <img src={coverPreviewUrl} alt="" className="absolute inset-0 size-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">
                  {gameLabel(featuredGameSlug)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-[#999999]">
              Mỗi lần có booking mới hoặc bạn cập nhật lịch sử chơi, hệ thống tính lại game nổi bật.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="ps-price" className="pd-text-label mb-2 block text-[#354052]">
                Giá / giờ (VNĐ)
              </label>
              <input
                id="ps-price"
                type="number"
                min={0}
                className="pd-input-field w-full"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label htmlFor="ps-rank" className="pd-text-label mb-2 block text-[#354052]">
                Rank hiển thị
              </label>
              <input
                id="ps-rank"
                className="pd-input-field w-full"
                value={rankLabel}
                onChange={(e) => setRankLabel(e.target.value)}
                placeholder="vd: Immortal 2"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 pd-text-body text-[#354052] md:col-span-2">
              <input type="checkbox" className="size-5 accent-[#6460FF]" checked={voiceOk} onChange={(e) => setVoiceOk(e.target.checked)} />
              Chơi voice / party
            </label>
            <label className="flex cursor-pointer items-center gap-3 pd-text-body text-[#354052] md:col-span-2">
              <input type="checkbox" className="size-5 accent-[#6460FF]" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} />
              Hiển thị đang online (live)
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="submit" variant="pdPrimary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
          <Button type="button" variant="pdSecondary" render={<Link to={`/players/${user.username}`} />}>
            Xem trang công khai
          </Button>
        </div>
      </div>
    </form>
  );
}
