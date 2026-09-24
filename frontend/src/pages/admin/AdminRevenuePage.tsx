import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type MonthRow = {
  _id: { y: number; m: number };
  platformFeeVnd: number;
  grossVnd: number;
  count: number;
};

type BookingRow = {
  id: string;
  hours: number;
  pricePerHourVnd: number;
  grossVnd: number;
  platformFeePercent: number;
  platformFeeVnd: number;
  status: string;
  note?: string;
  createdAt?: string;
  renter: { username: string; displayName?: string } | null;
  provider: { username: string; displayName?: string } | null;
};

export default function AdminRevenuePage() {
  const [byMonth, setByMonth] = useState<MonthRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [renterUsername, setRenterUsername] = useState("");
  const [providerUsername, setProviderUsername] = useState("");
  const [hours, setHours] = useState("1");
  const [pricePerHour, setPricePerHour] = useState("55000");
  const [feePct, setFeePct] = useState("15");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [rRes, bRes] = await Promise.all([apiFetch("/api/admin/revenue-report"), apiFetch("/api/admin/bookings")]);
      if (!rRes.ok || !bRes.ok) throw new Error("Không tải được dữ liệu.");
      const rData = (await rRes.json()) as { byMonth: MonthRow[] };
      const bData = (await bRes.json()) as { bookings: BookingRow[] };
      setByMonth(rData.byMonth ?? []);
      setBookings(bData.bookings ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/admin/bookings", {
        method: "POST",
        body: JSON.stringify({
          renterUsername: renterUsername.trim().toLowerCase(),
          providerUsername: providerUsername.trim().toLowerCase(),
          hours: Number(hours),
          pricePerHourVnd: Number(pricePerHour),
          platformFeePercent: Number(feePct),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.message === "string" ? j.message : "Không tạo được.");
      toast.success("Đã ghi nhận giao dịch.");
      setRenterUsername("");
      setProviderUsername("");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Doanh thu</h1>
        <p className="mt-2 text-sm text-slate-400">
          Phí nền tảng ghi trên từng giao dịch (mặc định 15%). Thêm giao dịch thủ công để demo báo cáo — sau này có thể nối thanh toán thật.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-semibold text-white">Theo tháng (đã hoàn tất)</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Đang tải…</p>
        ) : byMonth.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Chưa có dữ liệu.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500">
                  <th className="py-2 pr-3">Tháng</th>
                  <th className="py-2 pr-3">Số giao dịch</th>
                  <th className="py-2 pr-3">Phí nền tảng</th>
                  <th className="py-2">Tổng giá trị</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.map((row) => (
                  <tr key={`${row._id.y}-${row._id.m}`} className="border-b border-white/5 text-slate-200">
                    <td className="py-2 pr-3">
                      {row._id.m}/{row._id.y}
                    </td>
                    <td className="py-2 pr-3">{row.count}</td>
                    <td className="py-2 pr-3">{row.platformFeeVnd.toLocaleString("vi-VN")} ₫</td>
                    <td className="py-2">{row.grossVnd.toLocaleString("vi-VN")} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-semibold text-white">Ghi giao dịch (admin)</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => void handleCreate(e)}>
          <label className="text-xs text-slate-400">
            Username người thuê
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2 text-sm text-white"
              value={renterUsername}
              onChange={(e) => setRenterUsername(e.target.value)}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Username người cho thuê
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2 text-sm text-white"
              value={providerUsername}
              onChange={(e) => setProviderUsername(e.target.value)}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Giờ chơi
            <input
              type="number"
              step="0.25"
              min="0.25"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2 text-sm text-white"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Giá / giờ (₫)
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2 text-sm text-white"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Phí nền tảng (%)
            <input
              type="number"
              min="0"
              max="100"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2 text-sm text-white"
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="h-10 w-full rounded-lg bg-[#6460FF] text-sm font-semibold text-white hover:bg-[#5550dd] disabled:opacity-50"
            >
              {submitting ? "Đang lưu…" : "Thêm giao dịch"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-semibold text-white">Giao dịch gần đây</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500">
                <th className="py-2 pr-2">Thời điểm</th>
                <th className="py-2 pr-2">Người thuê</th>
                <th className="py-2 pr-2">Người cho thuê</th>
                <th className="py-2 pr-2">Giờ × giá</th>
                <th className="py-2 pr-2">Tổng</th>
                <th className="py-2">Phí NT</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-white/5 text-slate-200">
                  <td className="py-2 pr-2 text-slate-400">{b.createdAt ? new Date(b.createdAt).toLocaleString("vi-VN") : "—"}</td>
                  <td className="py-2 pr-2">{b.renter?.username ?? "—"}</td>
                  <td className="py-2 pr-2">{b.provider?.username ?? "—"}</td>
                  <td className="py-2 pr-2">
                    {b.hours} × {b.pricePerHourVnd.toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 pr-2">{b.grossVnd.toLocaleString("vi-VN")} ₫</td>
                  <td className="py-2">
                    {b.platformFeeVnd.toLocaleString("vi-VN")} ₫ ({b.platformFeePercent}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && !loading ? <p className="mt-3 text-sm text-slate-500">Chưa có giao dịch.</p> : null}
        </div>
      </section>
    </div>
  );
}
