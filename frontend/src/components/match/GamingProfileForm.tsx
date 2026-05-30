import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, getApiUrl } from "@/lib/api";
import type { AuthUser } from "@/types/user";
import type { GameTaxonomyItem } from "@/types/match";
import { cn } from "@/lib/utils";

type Row = { gameSlug: string; hoursPlayed: number; sessionsCount: number; lastPlayedAt: string };

const emptyRow = (): Row => ({
  gameSlug: "",
  hoursPlayed: 0,
  sessionsCount: 0,
  lastPlayedAt: "",
});

type Props = {
  user: AuthUser | null;
  onSaved?: () => void;
};

export function GamingProfileForm({ user, onSaved }: Props) {
  const [taxonomy, setTaxonomy] = useState<GameTaxonomyItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  const loadTaxonomy = useCallback(async () => {
    const res = await fetch(getApiUrl("/api/match/taxonomy"));
    if (!res.ok) return;
    const data = (await res.json()) as { games: GameTaxonomyItem[] };
    setTaxonomy(data.games ?? []);
  }, []);

  useEffect(() => {
    void loadTaxonomy();
  }, [loadTaxonomy]);

  useEffect(() => {
    const gp = user?.gamingProfile;
    if (!gp) return;
    setFavorites(new Set(gp.favoriteSlugs ?? []));
    const ph = gp.playHistory ?? [];
    if (ph.length > 0) {
      setRows(
        ph.map((r) => ({
          gameSlug: r.gameSlug,
          hoursPlayed: r.hoursPlayed ?? 0,
          sessionsCount: r.sessionsCount ?? 0,
          lastPlayedAt: r.lastPlayedAt ? String(r.lastPlayedAt).slice(0, 10) : "",
        }))
      );
    }
  }, [user?._id, user?.gamingProfile]);

  function toggleFavorite(slug: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const playHistory = rows
        .filter((r) => r.gameSlug)
        .map((r) => ({
          gameSlug: r.gameSlug,
          hoursPlayed: Math.max(0, Number(r.hoursPlayed) || 0),
          sessionsCount: Math.max(0, Math.floor(Number(r.sessionsCount) || 0)),
          ...(r.lastPlayedAt ? { lastPlayedAt: new Date(r.lastPlayedAt).toISOString() } : {}),
        }));

      const res = await apiFetch("/api/user/gaming-profile", {
        method: "PATCH",
        body: JSON.stringify({
          favoriteSlugs: [...favorites],
          playHistory,
        }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof err.message === "string" ? err.message : "Không lưu được.");
      }
      toast.success("Đã cập nhật sở thích & lịch sử .");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="pd-card-default">
        <h3 className="pd-text-h3 text-[#354052]">Game hay chơi (sở thích)</h3>
        <p className="pd-text-body-sm mt-2 text-[#666666]">
          Chọn một hoặc nhiều game.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {taxonomy.map((g) => {
            const on = favorites.has(g.slug);
            return (
              <button
                key={g.slug}
                type="button"
                onClick={() => toggleFavorite(g.slug)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                  on
                    ? "border-[#6460FF] bg-[rgb(100_96_255_/_0.15)] text-[#280071]"
                    : "border-black/10 bg-white text-[#354052] hover:border-[#6460FF]/50"
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pd-card-default">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="pd-text-h3 text-[#354052]">Lịch sử chơi (hành vi)</h3>
            <p className="pd-text-body-sm mt-1 text-[#666666]">
              Giờ chơi được chuẩn hoá theo phân bố người dùng — giúp nhấn mạnh game bạn đầu tư thời gian.
            </p>
          </div>
          <Button
            type="button"
            variant="pdGhost"
            onClick={() => setRows((r) => [...r, emptyRow()])}
          >
            + Thêm dòng
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-[10px] border border-black/[0.08] bg-[#fafafa] p-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div>
                <label className="pd-text-label mb-1 block text-[#354052]">Game</label>
                <select
                  className="pd-input-field w-full"
                  value={row.gameSlug}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, gameSlug: v } : x)));
                  }}
                >
                  <option value="">— Chọn —</option>
                  {taxonomy.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="pd-text-label mb-1 block text-[#354052]">Giờ chơi (ước lượng)</label>
                <input
                  type="number"
                  min={0}
                  className="pd-input-field w-full"
                  value={row.hoursPlayed || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, hoursPlayed: v === "" ? 0 : Number(v) } : x))
                    );
                  }}
                />
              </div>
              <div>
                <label className="pd-text-label mb-1 block text-[#354052]">Số phiên (tuỳ chọn)</label>
                <input
                  type="number"
                  min={0}
                  className="pd-input-field w-full"
                  value={row.sessionsCount || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, sessionsCount: v === "" ? 0 : Math.floor(Number(v)) } : x
                      )
                    );
                  }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                <label className="pd-text-label mb-1 block text-[#354052]">Chơi gần nhất</label>
                <input
                  type="date"
                  className="pd-input-field w-full"
                  value={row.lastPlayedAt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, lastPlayedAt: v } : x)));
                  }}
                />
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="pd-text-link text-left text-[#f64a00]"
                    onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Xoá dòng
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="pdPrimary" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu cho AI ghép cặp"}
        </Button>
        <p className="pd-text-caption max-w-xl text-[#666666]">
          sở thích + lịch sử + tầng thể loại rồi tính độ tương đồng cosinus với người chơi khác.
        </p>
      </div>
    </form>
  );
}
