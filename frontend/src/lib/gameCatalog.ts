/** Đồng bộ slug với `back-end/src/lib/gameTaxonomy.js` */
export const GAME_CATALOG_OPTIONS = [
  { slug: "valorant", label: "Valorant" },
  { slug: "lol", label: "Liên Minh Huyền Thoại" },
  { slug: "lolwr", label: "Tốc Chiến" },
  { slug: "pubgm", label: "PUBG Mobile" },
  { slug: "freefire", label: "Free Fire" },
  { slug: "cs2", label: "Counter-Strike 2" },
  { slug: "apex", label: "Apex Legends" },
  { slug: "genshin", label: "Genshin Impact" },
  { slug: "dota2", label: "Dota 2" },
  { slug: "fortnite", label: "Fortnite" },
] as const;

export type GameSlug = (typeof GAME_CATALOG_OPTIONS)[number]["slug"];

export function gameLabel(slug: string | undefined): string {
  const row = GAME_CATALOG_OPTIONS.find((g) => g.slug === slug);
  return row?.label ?? slug ?? "—";
}
