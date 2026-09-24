import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GoogleIcon } from "./GoogleIcon";

type Props = {
  intent: "signin" | "signup";
  className?: string;
};

export function GoogleOAuthButton({ intent, className }: Props) {
  const [pending, setPending] = useState(false);

  const handleClick = () => {
    const url = import.meta.env.VITE_GOOGLE_OAUTH_URL as string | undefined;
    if (url && url.length > 0) {
      setPending(true);
      window.location.assign(url);
      return;
    }
    toast.info("OAuth Google", {
      description:
        "Đang phát triển."
    });
  };

  const label =
    intent === "signup" ? "Đăng ký với Google" : "Đăng nhập với Google";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "btn-google-oauth group relative flex min-h-11 w-full items-center justify-center gap-3 overflow-hidden rounded-[8px] border border-[#dadce0] bg-white px-4 py-2.5 text-center text-[14px] font-medium leading-[21px] text-[#3c4043]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6460ff]",
        "disabled:pointer-events-none disabled:opacity-70",
        className
      )}
      aria-label={label}
    >
      <GoogleIcon className="relative size-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
      <span className="relative">{pending ? "Đang chuyển…" : label}</span>
    </button>
  );
}
