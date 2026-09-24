import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/user";
import { gameLabel } from "@/lib/gameCatalog";

const GENDER_VI: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
  prefer_not_say: "Không tiết lộ",
};

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function AdminProvidersPage() {
  const [applications, setApplications] = useState<AuthUser[]>([]);
  const [providers, setProviders] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, pRes] = await Promise.all([
        apiFetch("/api/admin/provider-applications"),
        apiFetch("/api/admin/providers"),
      ]);
      if (!aRes.ok || !pRes.ok) throw new Error("Không tải được dữ liệu.");
      const aData = (await aRes.json()) as { applications: AuthUser[] };
      const pData = (await pRes.json()) as { providers: AuthUser[] };
      setApplications(aData.applications ?? []);
      setProviders(pData.providers ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(targetId: string, status: "approved" | "rejected") {
    try {
      const res = await apiFetch(`/api/admin/provider-applications/${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.message === "string" ? j.message : res.statusText);
      toast.success(status === "approved" ? "Đã duyệt — tài khoản thành người cho thuê." : "Đã từ chối đơn.");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    }
  }

  async function revoke(targetId: string) {
    if (!window.confirm("Thu hồi quyền người cho thuê? Họ sẽ trở lại vai trò người thuê.")) return;
    try {
      const res = await apiFetch(`/api/admin/providers/${encodeURIComponent(targetId)}/revoke`, { method: "PATCH" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.message === "string" ? j.message : res.statusText);
      toast.success("Đã thu hồi.");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    }
  }

  const pending = applications.filter((u) => u.providerApplication?.status === "pending");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Người cho thuê</h1>
        <p className="mt-2 text-sm text-slate-400">
          Duyệt đơn đăng ký: chỉ tài khoản được duyệt mới có loại <strong className="text-slate-200">provider</strong> và hiển thị trên Khám phá (tài khoản mới đăng ký mặc định là người thuê).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-semibold text-white">Đơn chờ duyệt ({pending.length})</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Đang tải…</p>
        ) : pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Không có đơn chờ xử lý.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pending.map((u) => (
              <li key={u._id} className="rounded-lg border border-white/10 bg-[#0a0c10] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{u.displayName}</p>
                    <p className="font-mono text-xs text-slate-500">@{u.username}</p>
                    <p className="mt-1 text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-[#6460FF] px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => void decide(u._id, "approved")}
                    >
                      Duyệt
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200"
                      onClick={() => void decide(u._id, "rejected")}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Game đăng ký</dt>
                    <dd className="mt-0.5 font-medium text-slate-200">{gameLabel(u.providerApplication?.primaryGameSlug)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Giới tính</dt>
                    <dd className="mt-0.5 font-medium text-slate-200">
                      {GENDER_VI[u.providerApplication?.gender ?? ""] ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Giá đề xuất</dt>
                    <dd className="mt-0.5 font-medium text-slate-200">
                      {typeof u.providerApplication?.proposedPricePerHour === "number"
                        ? `${formatVnd(u.providerApplication.proposedPricePerHour)} ₫/giờ`
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {u.providerApplication?.skillImageUrls && u.providerApplication.skillImageUrls.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ảnh kỹ năng</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {u.providerApplication.skillImageUrls.map((src) => (
                        <li key={src} className="overflow-hidden rounded-lg border border-white/10">
                          <a href={src} target="_blank" rel="noreferrer" className="block">
                            <img src={src} alt="" className="size-16 object-cover" loading="lazy" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {u.providerApplication?.pitch ? (
                  <p className="mt-3 border-t border-white/10 pt-3 text-sm text-slate-300 whitespace-pre-wrap">{u.providerApplication.pitch}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-semibold text-white">Đã duyệt — danh sách người cho thuê ({providers.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500">
                <th className="py-2 pr-2">Hiển thị</th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Hồ sơ</th>
                <th className="py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((u) => (
                <tr key={u._id} className="border-b border-white/5 text-slate-200">
                  <td className="py-2 pr-2">
                    <span className="text-white">{u.displayName}</span>
                    <div className="font-mono text-xs text-slate-500">@{u.username}</div>
                  </td>
                  <td className="py-2 pr-2 text-slate-400">{u.email}</td>
                  <td className="py-2 pr-2">
                    <Link className="text-[#8b86ff] underline" to={`/players/${u.username}`}>
                      Xem công khai
                    </Link>
                  </td>
                  <td className="py-2">
                    <button type="button" className="text-xs font-semibold text-amber-300 hover:underline" onClick={() => void revoke(u._id)}>
                      Thu hồi quyền
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {providers.length === 0 && !loading ? <p className="mt-3 text-sm text-slate-500">Chưa có người cho thuê được duyệt.</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Lịch sử đơn (đã xử lý)</h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs text-slate-400">
          {applications
            .filter((u) => u.providerApplication?.status && u.providerApplication.status !== "pending")
            .map((u) => (
              <li key={u._id}>
                @{u.username} — <span className="text-slate-200">{u.providerApplication?.status}</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
