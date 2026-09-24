import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/user";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không tải được.");
        return res.json() as Promise<{ users: AuthUser[] }>;
      })
      .then((d) => {
        if (!cancelled) setUsers(d.users);
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
        <h1 className="text-2xl font-bold text-white">Người dùng</h1>
        <p className="mt-2 text-sm text-slate-400">Tất cả tài khoản đã đăng ký. Cột loại tài khoản: người thuê / người cho thuê (sau duyệt).</p>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500">
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">Hiển thị</th>
                <th className="p-3">Vai trò</th>
                <th className="p-3">Loại TK</th>
                <th className="p-3">Tạo lúc</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-white/5 text-slate-200">
                  <td className="p-3 font-mono text-xs">{u.username}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">{u.displayName}</td>
                  <td className="p-3">
                    <span className={u.role === "admin" ? "text-[#8b86ff]" : "text-slate-400"}>{u.role || "user"}</span>
                  </td>
                  <td className="p-3 text-slate-300">{u.accountType ?? "—"}</td>
                  <td className="p-3 text-xs text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleString("vi-VN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
