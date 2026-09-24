export type AuthUser = {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  role?: string;
  accountType?: "renter" | "provider";
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  providerApplication?: {
    status?: "none" | "pending" | "approved" | "rejected";
    pitch?: string;
    appliedAt?: string;
    primaryGameSlug?: string;
    gender?: "male" | "female" | "other" | "prefer_not_say";
    proposedPricePerHour?: number;
    skillImageUrls?: string[];
  };
  gamingProfile?: {
    favoriteSlugs?: string[];
    playHistory?: {
      gameSlug: string;
      hoursPlayed?: number;
      sessionsCount?: number;
      lastPlayedAt?: string;
    }[];
  };
  playerListing?: {
    pricePerHour?: number;
    rankLabel?: string;
<<<<<<< HEAD
    ranks?: { gameSlug: string; rankLabel: string }[];
=======
>>>>>>> 667b488a894bc37051b38ff9dafa8d98652a29a7
    primaryGameSlug?: string;
    ratingAvg?: number;
    reviewCount?: number;
    voiceOk?: boolean;
    isLive?: boolean;
    isVerifiedProvider?: boolean;
    featuredGameSlug?: string;
    listingCoverUrl?: string;
  };
  walletBalanceVnd?: number;
  totalTopUpVnd?: number;
};
