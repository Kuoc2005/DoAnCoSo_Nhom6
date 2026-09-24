import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Gamepad2, ImagePlus, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GAME_CATALOG_OPTIONS } from "@/lib/gameCatalog";

const GENDER_OPTIONS = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
  { value: "prefer_not_say", label: "Không tiết lộ" },
] as const;

function formatVndInput(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.floor(n)));
}

export default function BecomeProviderPage() {
  const { user, ready, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [primaryGameSlug, setPrimaryGameSlug] = useState("");
  const [gender, setGender] = useState<string>("");
  const [priceVnd, setPriceVnd] = useState("55000");
  const [skillUrls, setSkillUrls] = useState<string[]>([""]);
  const [pitch, setPitch] = useState("");

  const status = user?.providerApplication?.status ?? "none";

  useEffect(() => {
    const pa = user?.providerApplication;
    if (!pa || pa.status !== "rejected") return;
    if (pa.primaryGameSlug) setPrimaryGameSlug(pa.primaryGameSlug);
    if (pa.gender) setGender(pa.gender);
    if (typeof pa.proposedPricePerHour === "number" && pa.proposedPricePerHour > 0) {
      setPriceVnd(String(pa.proposedPricePerHour));
    }
    if (pa.skillImageUrls?.length) setSkillUrls([...pa.skillImageUrls]);
    if (pa.pitch) setPitch(pa.pitch);
  }, [user?._id, user?.providerApplication?.status]);

  function addSkillRow() {
    setSkillUrls((rows) => (rows.length >= 6 ? rows : [...rows, ""]));
  }

  function removeSkillRow(i: number) {
    setSkillUrls((rows) => (rows.length <= 1 ? [""] : rows.filter((_, idx) => idx !== i)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Đăng nhập để gửi đơn.");
      return;
    }
    const slug = primaryGameSlug.trim();
    if (!slug) {
      toast.error("Chọn game đăng ký.");
      return;
    }
    if (!gender) {
      toast.error("Chọn giới tính.");
      return;
    }
    const price = Number(String(priceVnd).replace(/\D/g, ""));
    if (Number.isNaN(price) || price < 10_000) {
      toast.error("Nhập giá cho thuê tối thiểu 10.000 ₫/giờ.");
      return;
    }
    const urls = skillUrls.map((u) => u.trim()).filter(Boolean);
    if (urls.length < 1) {
      toast.error("Thêm ít nhất một URL ảnh kỹ năng (vd. link Imgur, CDN).");
      return;
    }
    if (pitch.trim().length < 20) {
      toast.error("Giới thiệu tối thiểu 20 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/user/provider-application", {
        method: "POST",
        body: JSON.stringify({
          primaryGameSlug: slug,
          gender,
          proposedPricePerHour: price,
          skillImageUrls: urls.slice(0, 6),
          pitch: pitch.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j.message === "string" ? j.message : "Gửi đơn thất bại.");
      }
      toast.success("Đã gửi đơn. Admin sẽ xem xét.");
      await refreshUser();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="pd-text-body text-[#666666]">Đang tải...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_8px_40px_-16px_rgba(100,96,255,0.25)]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">Player Duo</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#280071] sm:text-3xl">Trở thành người cho thuê</h1>
          <p className="mt-3 max-w-lg pd-text-body text-[#666666]">
            Đăng nhập để gửi đơn kèm game, giá và ảnh minh chứng kỹ năng. Sau khi admin duyệt, bạn mới hiển thị trên Khám phá.
          </p>
          <Link to="/signin" className={cn(buttonVariants({ variant: "pdPrimary" }), "mt-8 inline-flex")}>
            Đăng nhập
          </Link>
        </div>
        <div className="hidden rounded-2xl bg-gradient-to-br from-[#7B19D8] via-[#6460FF] to-[#B8A4FF] p-8 text-white shadow-lg lg:block">
          <Sparkles className="size-10 opacity-90" aria-hidden />
          <p className="mt-6 text-lg font-bold leading-snug">Thu nhập từ đam mê game</p>
          <p className="mt-2 text-sm text-white/85">Thiết lập hồ sơ chuyên nghiệp, nhận booking và đồng hành cùng cộng đồng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-gradient-to-br from-[#faf7ff] via-white to-[#f0ecff] px-6 py-8 shadow-[0_8px_32px_-12px_rgba(123,25,216,0.2)] sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[#6460FF]/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 size-48 rounded-full bg-[#7B19D8]/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#6460FF] text-white shadow-lg shadow-[#6460FF]/30">
            <Gamepad2 className="size-7" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6460FF]">Đăng ký duo</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#280071] sm:text-3xl">Trở thành người cho thuê</h1>
            <p className="mt-2 max-w-2xl pd-text-body text-[#666666]">
              Điền form bên dưới — admin sẽ duyệt thủ công. Chỉ tài khoản{" "}
              <strong className="text-[#354052]">provider</strong> mới xuất hiện trên hub. Sau khi duyệt, hoàn thiện giao diện công khai tại{" "}
              <Link className="font-semibold text-[#6460FF] underline underline-offset-2" to="/profile/provider-studio">
                Studio cho thuê
              </Link>
              .
            </p>
            <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#6460FF]/20 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#280071] backdrop-blur-sm">
              Trạng thái đơn:
              <span className="text-[#6460FF]">
                {status === "none" && "Chưa gửi"}
                {status === "pending" && "Đang chờ duyệt"}
                {status === "approved" && "Đã duyệt"}
                {status === "rejected" && "Đã từ chối — có thể gửi lại"}
              </span>
            </p>
          </div>
        </div>
      </section>

      {status === "approved" ? (
        <div className="rounded-2xl border border-[#59EA5B]/40 bg-[#f4fdf5] px-6 py-5 text-[#1a4d1c]">
          <p className="font-semibold">Chúc mừng — bạn đã là người cho thuê.</p>
          <p className="mt-2 text-sm text-[#2d6b30]">
            <Link className="font-bold text-[#6460FF] underline" to="/profile/provider-studio">
              Mở Studio cho thuê
            </Link>{" "}
            để chỉnh avatar, ảnh bìa, rank và trạng thái online.
          </p>
        </div>
      ) : null}

      {status === "pending" ? (
        <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="pd-text-h2 text-[#280071]">Đơn đã gửi</h2>
          <p className="mt-2 pd-text-body text-[#666666]">Admin đang xem xét. Bạn có thể xem lại thông tin đã gửi bên dưới (chỉ đọc).</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#faf9ff] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#999999]">Game</dt>
              <dd className="mt-1 font-semibold text-[#354052]">
                {GAME_CATALOG_OPTIONS.find((g) => g.slug === user.providerApplication?.primaryGameSlug)?.label ?? "—"}
              </dd>
            </div>
            <div className="rounded-xl bg-[#faf9ff] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#999999]">Giới tính</dt>
              <dd className="mt-1 font-semibold text-[#354052]">
                {GENDER_OPTIONS.find((g) => g.value === user.providerApplication?.gender)?.label ?? "—"}
              </dd>
            </div>
            <div className="rounded-xl bg-[#faf9ff] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#999999]">Giá đề xuất</dt>
              <dd className="mt-1 font-semibold text-[#354052]">
                {formatVndInput(user.providerApplication?.proposedPricePerHour ?? 0)} ₫/giờ
              </dd>
            </div>
          </dl>
          {user.providerApplication?.pitch ? (
            <div className="mt-4 rounded-xl border border-black/[0.06] bg-[#fafafa] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#999999]">Giới thiệu</p>
              <p className="mt-2 whitespace-pre-wrap pd-text-body text-[#354052]">{user.providerApplication.pitch}</p>
            </div>
          ) : null}
          {user.providerApplication?.skillImageUrls && user.providerApplication.skillImageUrls.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#999999]">Ảnh kỹ năng</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {user.providerApplication.skillImageUrls.map((url) => (
                  <li key={url} className="overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-sm">
                    <a href={url} target="_blank" rel="noreferrer" className="block">
                      <img src={url} alt="" className="size-24 object-cover" loading="lazy" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : status === "approved" ? null : (
        <form
          className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_-12px_rgba(40,0,113,0.1)] sm:p-8"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <h2 className="pd-text-h2 text-[#280071]">Form đăng ký</h2>
          <p className="mt-1 pd-text-caption text-[#666666]">Các trường bắt buộc giúp admin đánh giá nhanh hồ sơ của bạn.</p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label htmlFor="pd-game" className="pd-text-label block text-[#354052]">
                Game đăng ký <span className="text-red-500">*</span>
              </label>
              <select
                id="pd-game"
                required
                value={primaryGameSlug}
                onChange={(e) => setPrimaryGameSlug(e.target.value)}
                className="pd-input-field mt-2 w-full"
              >
                <option value="">— Chọn game —</option>
                {GAME_CATALOG_OPTIONS.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pd-gender" className="pd-text-label block text-[#354052]">
                Giới tính <span className="text-red-500">*</span>
              </label>
              <select
                id="pd-gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="pd-input-field mt-2 w-full"
              >
                <option value="">— Chọn —</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pd-price" className="pd-text-label block text-[#354052]">
                Giá cho thuê (₫/giờ) <span className="text-red-500">*</span>
              </label>
              <input
                id="pd-price"
                type="text"
                inputMode="numeric"
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value.replace(/[^\d]/g, ""))}
                className="pd-input-field mt-2 w-full max-w-md"
                placeholder="55000"
              />
              <p className="mt-1 pd-text-caption text-[#999999]">Tối thiểu 10.000 ₫/giờ. Ví dụ: 55000</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2">
              <ImagePlus className="size-5 text-[#6460FF]" aria-hidden />
              <span className="pd-text-label text-[#354052]">
                Ảnh kỹ năng (URL) <span className="text-red-500">*</span>
              </span>
            </div>
            <p className="mt-1 pd-text-caption text-[#666666]">Dán link ảnh công khai (Imgur, Google Drive ảnh trực tiếp, v.v.). Tối đa 6 ảnh.</p>
            <ul className="mt-4 space-y-3">
              {skillUrls.map((row, i) => (
                <li key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={row}
                    onChange={(e) =>
                      setSkillUrls((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                    className="pd-input-field min-w-0 flex-1"
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="pdGhost"
                    className="shrink-0 px-3"
                    disabled={skillUrls.length <= 1}
                    onClick={() => removeSkillRow(i)}
                    aria-label="Xóa dòng"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button type="button" variant="pdSecondary" className="mt-3" disabled={skillUrls.length >= 6} onClick={addSkillRow}>
              Thêm ảnh
            </Button>
          </div>

          <div className="mt-8">
            <label htmlFor="pd-pitch" className="pd-text-label block text-[#354052]">
              Giới thiệu &amp; kinh nghiệm <span className="text-red-500">*</span>
            </label>
            <textarea
              id="pd-pitch"
              rows={6}
              maxLength={800}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="pd-input-field mt-2 min-h-[140px] w-full resize-y"
              placeholder="Rank, vai trí trong team, giờ chơi, ngôn ngữ voice chat, phong cách duo… (tối thiểu 20 ký tự)"
            />
            <p className="mt-1 pd-text-caption text-[#999999]">{pitch.length}/800</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button type="submit" variant="pdPrimary" disabled={submitting}>
              {submitting ? "Đang gửi..." : status === "rejected" ? "Gửi lại đơn" : "Gửi đơn duyệt"}
            </Button>
            <Link to="/explore" className={cn(buttonVariants({ variant: "pdSecondary" }))}>
              Xem hub
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
