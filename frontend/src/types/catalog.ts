export type CatalogHomeResponse = {
  stats: { totalPlayers: number };
  categories: { slug: string; label: string; playerCount: number }[];
  featuredPlayers: ListingCardPayload[];
  hotGames: { slug: string; label: string; playerCount: number; gradientKey: string }[];
};

export type ListingCardPayload = {
  id: string;
  username: string;
  name: string;
  game: string;
  rank: string;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  online?: boolean;
  badge?: string;
  voiceOk?: boolean;
  games: string[];
  avatarClassName: string;
  avatarUrl?: string;
  listingCoverUrl?: string;
  featuredGameSlug?: string;
};

export type ListingsResponse = {
  listings: ListingCardPayload[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
