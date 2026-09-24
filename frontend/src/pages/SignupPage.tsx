import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthEmailDivider } from "@/components/auth/AuthEmailDivider";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { useAuth } from "@/contexts/AuthContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUp, user, ready } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) {
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    }
  }, [ready, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!terms) {
      toast.error("Vui lòng đồng ý điều khoản.");
      return;
    }
    if (!username.trim() || !displayName.trim() || !email.trim() || password.length < 6) {
      toast.error("Điền đủ thông tin; mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    setSubmitting(true);
    try {
      const me = await signUp({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
      });
      toast.success("Đăng ký và đăng nhập thành công.");
      navigate(me?.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card-surface w-full max-w-[440px]">
      <div className="relative z-10 rounded-[14px] border border-border bg-card p-6 shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] sm:p-8">
        <h1 className="auth-fade-up auth-delay-1 text-display text-brand-deep">Đăng ký</h1>
        <p className="auth-fade-up auth-delay-2 text-body mt-2 text-text-secondary">
          Tạo hồ sơ và bắt đầu ghép đội — lưu vào MongoDB qua API.
        </p>

        <div className="auth-fade-up auth-delay-3 mt-8">
          <GoogleOAuthButton intent="signup" />
        </div>

        <AuthEmailDivider />

        <form className="auth-fade-up auth-delay-5 mt-2 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="signup-username" className="text-label mb-1 block text-brand-deep">
              Tên đăng nhập
            </label>
            <input
              id="signup-username"
              className="input-playerduo w-full"
              autoComplete="username"
              placeholder="vd: gamer_vn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="signup-name" className="text-label mb-1 block text-brand-deep">
              Tên hiển thị
            </label>
            <input
              id="signup-name"
              className="input-playerduo w-full"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="text-label mb-1 block text-brand-deep">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              className="input-playerduo w-full"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="text-label mb-1 block text-brand-deep">
              Mật khẩu
            </label>
            <input
              id="signup-password"
              type="password"
              className="input-playerduo w-full"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="signup-games" className="text-label mb-1 block text-brand-deep">
              Game yêu thích
            </label>
            <textarea
              id="signup-games"
              className="textarea-playerduo w-full"
              rows={2}
              placeholder="Valorant, LMHT, ..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={submitting}
            />
          </div>
          <label className="text-body flex cursor-pointer items-start gap-2 text-text-secondary">
            <input
              type="checkbox"
              className="mt-1 size-6 shrink-0 rounded-sm border border-border accent-[#6460ff]"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              disabled={submitting}
            />
            <span>Tôi đồng ý với điều khoản và chính sách.</span>
          </label>
          <Button type="submit" variant="playerduoPrimary" className="min-h-11 w-full sm:min-h-8" disabled={submitting}>
            {submitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>
        </form>

        <p className="auth-fade-up auth-delay-6 text-body mt-8 text-center text-text-secondary">
          Đã có tài khoản?{" "}
          <Link to="/signin" className="link-playerduo-secondary font-semibold text-[#6460ff] hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
