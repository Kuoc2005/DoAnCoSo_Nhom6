import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/user";

export default function AdminSeekersPage() {
  const [seekers, setSeekers] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/seekers")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không tải được.");
        return res.json() as Promise<{ seekers: AuthUser[] }>;
      })
      .then((d) => {
        if (!cancelled) setSeekers(d.seekers);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lỗi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Người tìm bạn chơi</h1>
        <p className="mt-2 text-sm text-slate-400">Có ít nhất game yêu thích hoặc lịch sử chơi — thường là người thuê đang tìm đồng đội / ghép rank.</p>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500">
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">Game yêu thích</th>
                <th className="p-3">Lịch sử</th>
                <th className="p-3">Loại TK</th>
              </tr>
            </thead>
            <tbody>
              {seekers.map((u) => (
                <tr key={u._id} className="border-b border-white/5 text-slate-200">
                  <td className="p-3 font-mono text-xs">{u.username}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3 text-slate-400">{(u.gamingProfile?.favoriteSlugs ?? []).join(", ") || "—"}</td>
                  <td className="p-3 text-slate-400">
                    {(u.gamingProfile?.playHistory ?? []).length > 0 ? `${u.gamingProfile?.playHistory?.length} dòng` : "—"}
                  </td>
                  <td className="p-3 text-slate-300">{u.accountType ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
