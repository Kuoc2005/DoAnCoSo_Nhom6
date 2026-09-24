import { Link } from "react-router";
import { cn } from "@/lib/utils";

export type GameCategory = {
  id: string;
  label: string;
  /** Tailwind gradient classes for thumbnail placeholder */
  gradient: string;
};

type GameCategoryStripProps = {
  categories: GameCategory[];
  className?: string;
};

export function GameCategoryStrip({ categories, className }: GameCategoryStripProps) {
  return (
    <div className={cn("-mx-1 flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]", className)}>
      {categories.map((c) => (
        <Link
          key={c.id}
          to={`/explore?game=${encodeURIComponent(c.id)}`}
          className="group flex w-[104px] shrink-0 flex-col gap-2 rounded-[12px] border border-black/[0.08] bg-white p-2 text-left shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] transition-shadow hover:shadow-[0_0_12px_rgb(100_96_255_/_0.15)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6460FF]"
        >
          <div
            className={cn(
              "aspect-square w-full rounded-[8px] bg-gradient-to-br shadow-inner",
              c.gradient
            )}
            aria-hidden
          />
          <span className="line-clamp-2 min-h-[32px] pd-text-body-sm font-semibold leading-tight text-[#354052] group-hover:text-[#6460FF]">
            {c.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
