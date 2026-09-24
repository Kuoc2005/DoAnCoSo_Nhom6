import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ChevronRight, Gamepad2, Pencil, Sparkles, User, Wallet, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ProfileHubPage() {
  const { user, ready, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
  }, [user]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j.message === "string" ? j.message : "Không lưu được.");
      }
      toast.success("Đã cập nhật hồ sơ.");
      await refreshUser();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return <p className="pd-text-body text-[#666666]">Đang tải...</p>;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
        <p className="pd-text-body text-[#354052]">Đăng nhập để chỉnh sửa hồ sơ.</p>
        <Link to="/signin" className="mt-4 inline-block font-semibold text-[#6460FF] underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  const isProvider = user.accountType === "provider";
  const wallet = new Intl.NumberFormat("vi-VN").format(user.walletBalanceVnd ?? 0);

  const shortcuts = [
    { to: "/profile/account", label: "Tài khoản & email", desc: "Thông tin đăng nhập", icon: User },
    { to: "/profile/wallet", label: "Ví & nạp tiền", desc: `${wallet} ₫`, icon: Wallet },
    { to: "/profile/gaming", label: "Sở thích & AI", desc: "Ghép đồng đội thông minh", icon: Gamepad2 },
    isProvider
      ? { to: "/profile/provider-studio", label: "Studio cho thuê", desc: "Avatar, giá, online", icon: Sparkles }
      : { to: "/profile/listing", label: "Thẻ duo", desc: "Hiển thị sau khi duyệt", icon: Layers },
    ...(!isProvider ? [{ to: "/profile/become-provider", label: "Đăng ký duo", desc: "Gửi đơn cho admin", icon: Pencil }] : []),
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-gradient-to-br from-[#6460FF] via-[#5b4bd4] to-[#7B19D8] p-6 text-white shadow-[0_16px_48px_-20px_rgba(100,96,255,0.45)] sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="size-24 overflow-hidden rounded-full border-4 border-white/90 bg-white/20 shadow-lg sm:size-28">
              {avatarUrl.trim() ? (
                <img src={avatarUrl.trim()} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-white/25 text-3xl font-black text-white">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Xin chào</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{user.displayName}</h2>
            <p className="mt-1 font-mono text-sm text-white/80">@{user.username}</p>
            <p className="mt-2 text-sm text-white/85">
              {isProvider ? "Bạn đang là người cho thuê." : "Bạn đang là người thuê — có thể đăng ký duo bất cứ lúc nào."}
            </p>
            <Link
              to={`/players/${user.username}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
            >
              Xem trang công khai
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <form
          className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8 lg:col-span-3"
          onSubmit={(e) => void handleSave(e)}
        >
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#280071]">
            <Pencil className="size-5 text-[#6460FF]" aria-hidden />
            Chỉnh sửa nhanh
          </h3>
          <p className="mt-1 text-sm text-[#666666]">Tên hiển thị, giới thiệu và ảnh đại diện (URL) dùng khắp nền tảng.</p>

          <label className="pd-text-label mt-6 block text-[#354052]" htmlFor="hub-name">
            Tên hiển thị
          </label>
          <input
            id="hub-name"
            className="pd-input-field mt-2 w-full"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            required
          />

          <label className="pd-text-label mt-4 block text-[#354052]" htmlFor="hub-avatar">
            URL ảnh đại diện
          </label>
          <input
            id="hub-avatar"
            type="text"
            className="pd-input-field mt-2 w-full"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />

          <label className="pd-text-label mt-4 block text-[#354052]" htmlFor="hub-bio">
            Giới thiệu
          </label>
          <textarea
            id="hub-bio"
            className="pd-input-field mt-2 min-h-[100px] w-full resize-y"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Một vài dòng về bạn..."
          />
          <p className="mt-1 text-xs text-[#999999]">{bio.length}/500</p>

          <Button type="submit" variant="pdPrimary" className="mt-6 min-h-11" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>

        <div className="space-y-3 lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">Lối tắt</h3>
          <ul className="space-y-2">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm transition",
                      "hover:border-[#6460FF]/30 hover:bg-[#faf9ff]"
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F1EEFF] text-[#6460FF]">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[#280071]">{item.label}</span>
                      <span className="block truncate text-xs text-[#666666]">{item.desc}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[#999999]" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
