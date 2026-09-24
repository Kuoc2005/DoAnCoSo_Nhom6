import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "@/lib/api";

type ListingRow = {
  id: string;
  username: string;
  name: string;
  game: string;
  rank: string;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  email?: string;
  accountType?: string;
  providerStatus?: string;
  isVerifiedProvider?: boolean;
};

export default function AdminHubListingsPage() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/hub-listings")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không tải được.");
        return res.json() as Promise<{ listings: ListingRow[] }>;
      })
      .then((d) => {
        if (!cancelled) setListings(d.listings);
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
        <h1 className="text-2xl font-bold text-white">Listing hub</h1>
        <p className="mt-2 text-sm text-slate-400">
          Snapshot thẻ hiển thị (kể cả người thuê chưa được duyệt NTCH). Trên trang Khám phá chỉ lọc người cho thuê đã duyệt + tài khoản cũ.
        </p>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500">
                <th className="p-3">Hiển thị</th>
                <th className="p-3">Email</th>
                <th className="p-3">Loại TK</th>
                <th className="p-3">Game</th>
                <th className="p-3">Giá/giờ</th>
                <th className="p-3">Đơn NTCH</th>
                <th className="p-3">Xác minh</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((row) => (
                <tr key={row.id} className="border-b border-white/5 text-slate-200">
                  <td className="p-3">
                    <Link className="font-medium text-[#8b86ff] hover:underline" to={`/players/${row.username}`}>
                      {row.name}
                    </Link>
                    <div className="font-mono text-xs text-slate-500">@{row.username}</div>
                  </td>
                  <td className="p-3 text-slate-400">{row.email ?? "—"}</td>
                  <td className="p-3 text-slate-300">{row.accountType ?? "—"}</td>
                  <td className="p-3">{row.game}</td>
                  <td className="p-3">{row.pricePerHour?.toLocaleString("vi-VN")} ₫</td>
                  <td className="p-3 text-xs">{row.providerStatus ?? "none"}</td>
                  <td className="p-3">{row.isVerifiedProvider ? "Có" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
