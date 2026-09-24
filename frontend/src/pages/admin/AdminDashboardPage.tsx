import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "@/lib/api";

type Stats = {
  totalUsers: number;
  totalAdmins: number;
  providersTotal: number;
  rentersTotal: number;
  pendingProviderApplications: number;
  completedBookings: number;
  totalPlatformRevenueVnd: number;
  totalGrossTurnoverVnd: number;
};

type MonthRow = {
  _id: { y: number; m: number };
  platformFeeVnd: number;
  grossVnd: number;
  count: number;
};

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function BarRow({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-300">
          {value.toLocaleString("vi-VN")}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6460FF] to-[#8b86ff]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [byMonth, setByMonth] = useState<MonthRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch("/api/admin/dashboard-stats").then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(typeof j.message === "string" ? j.message : res.statusText);
        }
        return res.json() as Promise<Stats>;
      }),
      apiFetch("/api/admin/revenue-report").then(async (res) => {
        if (!res.ok) return { byMonth: [] as MonthRow[] };
        return res.json() as Promise<{ byMonth: MonthRow[] }>;
      }),
    ])
      .then(([s, rev]) => {
        if (!cancelled) {
          setStats(s);
          setByMonth(rev.byMonth ?? []);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lỗi");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const monthChrono = useMemo(() => [...byMonth].reverse().slice(-12), [byMonth]);
  const maxGross = useMemo(() => Math.max(1, ...monthChrono.map((r) => r.grossVnd || 0)), [monthChrono]);

  const roleMax = useMemo(() => {
    if (!stats) return 1;
    return Math.max(1, stats.rentersTotal, stats.providersTotal, stats.totalAdmins);
  }, [stats]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard thống kê</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Tổng hợp người dùng, đơn duo, booking và doanh thu nền tảng. Số liệu người cho thuê trên hub{" "}
            <strong className="text-slate-200">không tính tài khoản admin</strong> (trùng với trang chủ / Khám phá).
          </p>
        </div>
        <Link to="/admin" className="text-sm font-medium text-[#8b86ff] hover:text-white hover:underline">
          ← Tổng quan
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Tổng người dùng" value={String(stats.totalUsers)} hint={`${stats.totalAdmins} tài khoản admin (ẩn trên hub)`} />
            <Card title="Người thuê" value={String(stats.rentersTotal)} hint="Đăng ký mặc định" />
            <Card title="Người cho thuê (hub)" value={String(stats.providersTotal)} hint="Đã duyệt, hiển thị công khai" />
            <Card title="Đơn chờ duyệt" value={String(stats.pendingProviderApplications)} hint="Đăng ký trở thành NTCH" />
            <Card title="Booking hoàn tất" value={String(stats.completedBookings)} hint="Ghi nhận doanh thu" />
            <Card
              title="Phí nền tảng (tích lũy)"
              value={`${stats.totalPlatformRevenueVnd.toLocaleString("vi-VN")} ₫`}
              hint={`Tổng giao dịch: ${stats.totalGrossTurnoverVnd.toLocaleString("vi-VN")} ₫`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold text-white">Cơ cấu vai trò</h2>
              <p className="mt-1 text-xs text-slate-500">So sánh tương đối (max = 100% thanh)</p>
              <div className="mt-6 space-y-4">
                <BarRow label="Người thuê" value={stats.rentersTotal} max={roleMax} />
                <BarRow label="Người cho thuê (hub)" value={stats.providersTotal} max={roleMax} />
                <BarRow label="Admin" value={stats.totalAdmins} max={roleMax} />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold text-white">Doanh thu gộp theo tháng</h2>
              <p className="mt-1 text-xs text-slate-500">Từ booking hoàn tất (tối đa 12 tháng gần nhất)</p>
              {monthChrono.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">Chưa có dữ liệu theo tháng.</p>
              ) : (
                <div className="mt-6 space-y-3">
                  {monthChrono.map((row) => (
                    <BarRow
                      key={`${row._id.y}-${row._id.m}`}
                      label={`Tháng ${row._id.m}/${row._id.y}`}
                      value={row.grossVnd}
                      max={maxGross}
                      suffix=" ₫"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        !error && <p className="text-sm text-slate-500">Đang tải dashboard…</p>
      )}
    </div>
  );
}
