import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthEmailDivider } from "@/components/auth/AuthEmailDivider";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { useAuth } from "@/contexts/AuthContext";

const SigninPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, ready } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (ready && user) {
      const target = user.role === "admin" ? "/admin" : from;
      navigate(target, { replace: true });
    }
  }, [ready, user, navigate, from]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login.trim() || !password) {
      toast.error("Nhập đủ tên đăng nhập/email và mật khẩu.");
      return;
    }
    setSubmitting(true);
    try {
      const me = await signIn(login.trim(), password);
      toast.success("Đăng nhập thành công.");
      navigate(me?.role === "admin" ? "/admin" : from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card-surface w-full max-w-[440px]">
      <div className="relative z-10 rounded-[14px] border border-border bg-card p-6 shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] sm:p-8">
        <h1 className="auth-fade-up auth-delay-1 text-display text-brand-deep">Đăng nhập</h1>
        <p className="auth-fade-up auth-delay-2 text-body mt-2 text-text-secondary">
          Chào mừng quay lại Player Duo.
        </p>

        <div className="auth-fade-up auth-delay-3 mt-8">
          <GoogleOAuthButton intent="signin" />
        </div>

        <AuthEmailDivider />

        <form className="auth-fade-up auth-delay-5 mt-2 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="signin-email" className="text-label mb-1 block text-brand-deep">
              Email hoặc tên đăng nhập
            </label>
            <input
              id="signin-email"
              className="input-playerduo w-full"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="signin-password" className="text-label mb-1 block text-brand-deep">
              Mật khẩu
            </label>
            <input
              id="signin-password"
              type="password"
              className="input-playerduo w-full"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-body flex cursor-pointer items-center gap-2 text-text-secondary">
              <input type="checkbox" className="size-6 shrink-0 rounded-sm border border-border accent-[#6460ff]" />
              Ghi nhớ
            </label>
            <span className="link-playerduo-secondary text-sm opacity-60">Quên mật khẩu? (sắp có)</span>
          </div>
          <Button type="submit" variant="playerduoPrimary" className="mt-2 min-h-11 w-full sm:min-h-8" disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </form>

        <p className="auth-fade-up auth-delay-6 text-body mt-8 text-center text-text-secondary">
          Chưa có tài khoản?{" "}
          <Link to="/signup" className="link-playerduo-secondary font-semibold text-[#6460ff] hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SigninPage;
