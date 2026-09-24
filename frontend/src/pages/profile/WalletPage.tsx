import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function WalletPage() {
  const { user, ready, refreshUser } = useAuth();
  const [amount, setAmount] = useState("100000");
  const [loading, setLoading] = useState(false);

  async function handleTopUp(e: FormEvent) {
    e.preventDefault();
    const n = Math.floor(Number(amount));
    if (!Number.isFinite(n) || n < 10_000) {
      toast.error("Tối thiểu 10.000 ₫.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/user/wallet/top-up", {
        method: "POST",
        body: JSON.stringify({ amountVnd: n }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.message === "string" ? j.message : "Nạp thất bại.");
      toast.success(`Đã nạp ${formatVnd(n)} ₫ (demo).`);
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <p className="pd-text-body text-[#666666]">Đang tải...</p>;
  if (!user) {
    return (
      <div className="pd-card-default text-center">
        <p className="pd-text-body text-[#354052]">Đăng nhập để dùng ví.</p>
        <Link to="/signin" className="mt-4 inline-block font-semibold text-[#6460FF] underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  const bal = user.walletBalanceVnd ?? 0;

  return (
    <div className="space-y-6">
      <div className="pd-card-default">
        <h2 className="pd-text-h2 text-[#354052]">Ví &amp; nạp tiền</h2>
        <p className="pd-text-body-sm mt-2 text-[#666666]">
          Demo nạp tiền tức thì (không cổng thanh toán). Dùng số dư để <strong>Thuê ngay</strong> trên hồ sơ người cho thuê.
        </p>
        <p className="pd-text-h3 mt-6 text-[#6460FF]">{formatVnd(bal)} ₫</p>
        <p className="pd-text-caption mt-1 text-[#999999]">Số dư hiện tại</p>
      </div>

      <div className="pd-card-default">
        <h3 className="pd-text-label text-[#354052]">Nạp tiền (demo)</h3>
        <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => void handleTopUp(e)}>
          <div className="flex-1">
            <label htmlFor="topup-amt" className="pd-text-caption text-[#666666]">
              Số tiền (VNĐ)
            </label>
            <input
              id="topup-amt"
              type="number"
              min={10000}
              step={10000}
              className="pd-input-field mt-1 w-full max-w-xs"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["100000", "500000", "1000000"].map((v) => (
              <button
                key={v}
                type="button"
                className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-[#354052] hover:border-[#6460FF]"
                onClick={() => setAmount(v)}
              >
                +{formatVnd(Number(v))}
              </button>
            ))}
          </div>
          <Button type="submit" variant="pdPrimary" disabled={loading}>
            {loading ? "Đang nạp..." : "Nạp vào ví"}
          </Button>
        </form>
      </div>
    </div>
  );
}
