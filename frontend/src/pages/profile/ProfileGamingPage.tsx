import { Link } from "react-router";
import { GamingProfileForm } from "@/components/match/GamingProfileForm";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileGamingPage() {
  const { user, ready, refreshUser } = useAuth();

  if (!ready) return <p className="pd-text-body text-[#666666]">Đang tải...</p>;

  if (!user) {
    return (
      <div className="pd-card-default text-center">
        <p className="pd-text-body text-[#354052]">Đăng nhập để lưu sở thích.</p>
        <Link to="/signin" className="mt-4 inline-block font-semibold text-[#6460FF] underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return <GamingProfileForm user={user} onSaved={() => void refreshUser()} />;
}
