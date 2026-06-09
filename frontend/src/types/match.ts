import type { AuthUser } from "@/types/user";

export type GameTaxonomyItem = {
  slug: string;
  label: string;
  genres: string[];
  coverUrl?: string;
};

export type MatchExplanation = {
  sharedFavoriteSlugs: string[];
  sharedHistorySlugs: string[];
  sharedGenres: string[];
  labels: string[];
};

export type MatchSuggestionItem = {
  score: number;
  scorePercent: number;
  explanation: MatchExplanation;
  user: {
    id: string;
    username: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    gamingProfile?: AuthUser["gamingProfile"];
    createdAt?: string;
  };
};

export type MatchSuggestionsResponse = {
  algorithm: string;
  weights: { preference: number; playHistory: number; genreLayer: number };
  minScorePercent: number;
  suggestions: MatchSuggestionItem[];
};
