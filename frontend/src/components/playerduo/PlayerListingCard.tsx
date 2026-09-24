import { Link } from "react-router";
import { MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlayerListingCardProps = {
  id: string;
  /** Dùng cho route /players/:username */
  username?: string;
  name: string;
  game: string;
  rank: string;
  /** VND per hour (display only) */
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  online?: boolean;
  badge?: string;
  avatarClassName?: string;
  avatarUrl?: string;
  compact?: boolean;
  voiceOk?: boolean;
};

function formatPriceVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function PlayerListingCard({
  username,
  name,
  game,
  rank,
  pricePerHour,
  rating,
  reviewCount,
  online,
  badge,
  avatarClassName,
  avatarUrl,
  compact,
  voiceOk,
}: PlayerListingCardProps) {
  const profileTo = username ? `/players/${username}` : "/profile/account";
  return (
    <article
      className={cn(
        "pd-card-default flex flex-col transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgb(100_96_255_/_0.25)]",
        compact && "!p-4"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 overflow-hidden rounded-[10px] border-2 border-white shadow-[0_4px_12px_rgb(0_0_0_/_0.12)] sm:rounded-[12px]">
          <div
            className={cn(
              "size-20 bg-gradient-to-br from-[#280071] to-[#6460FF] sm:size-[88px]",
              !avatarUrl && avatarClassName
            )}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" loading="lazy" />
            ) : null}
          </div>
          {online ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-[#59EA5B] shadow-sm"
              title="Đang online"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate pd-text-h3 text-[#354052]">{name}</h3>
                {badge ? (
                  <span className="rounded-full bg-[rgb(100_96_255_/_0.12)] px-2 py-0.5 pd-text-caption font-semibold text-[#6460FF]">
                    {badge}
                  </span>
                ) : null}
                {voiceOk === false ? (
                  <span className="pd-text-caption text-[#999999]">Không voice</span>
                ) : null}
              </div>
              <p className="mt-1 pd-text-body-sm text-[#666666]">
                {game}
                <span className="text-[#CCCCCC]"> · </span>
                {rank}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="pd-text-caption uppercase tracking-wide text-[#999999]">Giá / giờ</p>
              <p className="pd-text-h3 whitespace-nowrap text-[#280071]">
                {formatPriceVnd(pricePerHour)}
                <span className="pd-text-body-sm font-normal text-[#666666]"> ₫</span>
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-[#FFB800]">
              <Star className="size-4 fill-current" aria-hidden />
              <span className="pd-text-body font-semibold text-[#354052]">{rating.toFixed(1)}</span>
              <span className="pd-text-caption text-[#999999]">({reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("mt-5 flex flex-wrap gap-2", compact && "mt-4")}>
        <Button variant="playerduoPrimary" className="min-h-10 flex-1 sm:min-h-8 sm:flex-none" render={<Link to={profileTo} />}>
          Hồ sơ
        </Button>
        <Button variant="playerduoGhost" className="min-h-10 flex-1 sm:min-h-8 sm:flex-none" render={<Link to={profileTo} />}>
          <MessageCircle className="mr-1.5 size-4" />
          Thuê ngay
        </Button>
      </div>
    </article>
  );
}
