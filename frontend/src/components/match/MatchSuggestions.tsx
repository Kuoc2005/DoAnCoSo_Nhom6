import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { MatchSuggestionsResponse } from "@/types/match";
import { cn } from "@/lib/utils";

/**
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const MIN_SCORE_STORAGE_KEY = "matchMinScorePercent";
const WEIGHTS_STORAGE_KEY = "matchWeights";

const DEFAULT_MIN_SCORE = 30;

const DEFAULT_WEIGHTS = {
  preference: 45,
  playHistory: 35,
  genreLayer: 20,
};

type WeightPercents = typeof DEFAULT_WEIGHTS;

type Algorithm = "cosine" | "recommendation";

/**
 * =========================================================
 * RECOMMENDATION TYPES
 * =========================================================
 */

type RecommendationUser = {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;

  gamingProfile?: {
    favoriteSlugs?: string[];

    playHistory?: Array<{
      gameSlug: string;
      hoursPlayed?: number;
      sessionsCount?: number;
      lastPlayedAt?: string;
    }>;
  };

  createdAt?: string;
};

type RecommendationBreakdown = {
  favorite: number;
  history: number;
  rank: number;
  activity: number;
  sessions: number;
};

type RecommendationExplanation = {
  sharedFavoriteGames: string[];
  sharedHistoryGames: string[];
  reasons: string[];
};

type RecommendationItem = {
  score: number;
  scorePercent: number;

  breakdown: RecommendationBreakdown;

  explanation: RecommendationExplanation;

  user: RecommendationUser;
};

type RecommendationResponse = {
  algorithm: string;

  weights: {
    favorite: number;
    playHistory: number;
    rank: number;
    activity: number;
    sessions: number;
  };

  recommendations?: RecommendationItem[];

  // Cho phép backend trả "teammates" nếu controller của bạn
  // đang dùng tên này.
  teammates?: RecommendationItem[];
};

/**
 * =========================================================
 * LOCAL STORAGE
 * =========================================================
 */

function clampPercent(value: unknown, fallback: number): number {
  const n =
    typeof value === "number"
      ? value
      : parseInt(String(value), 10);

  if (Number.isNaN(n)) return fallback;

  return Math.min(100, Math.max(0, n));
}

function readStoredMinScore(): number {
  try {
    const raw = localStorage.getItem(MIN_SCORE_STORAGE_KEY);

    if (raw == null) {
      return DEFAULT_MIN_SCORE;
    }

    const n = parseInt(raw, 10);

    if (Number.isNaN(n)) {
      return DEFAULT_MIN_SCORE;
    }

    return Math.min(100, Math.max(0, n));
  } catch {
    return DEFAULT_MIN_SCORE;
  }
}

function readStoredWeights(): WeightPercents {
  try {
    const raw = localStorage.getItem(WEIGHTS_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_WEIGHTS;
    }

    const parsed = JSON.parse(raw) as Partial<WeightPercents>;

    return {
      preference: clampPercent(
        parsed.preference,
        DEFAULT_WEIGHTS.preference
      ),

      playHistory: clampPercent(
        parsed.playHistory,
        DEFAULT_WEIGHTS.playHistory
      ),

      genreLayer: clampPercent(
        parsed.genreLayer,
        DEFAULT_WEIGHTS.genreLayer
      ),
    };
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

function parsePercentInput(
  raw: string,
  fallback: number
): number | null {
  const n = parseInt(raw, 10);

  if (Number.isNaN(n)) {
    return null;
  }

  return Math.min(100, Math.max(0, n));
}

/**
 * =========================================================
 * COSINE API URL
 * =========================================================
 */

function buildSuggestionsUrl(
  minScore: number,
  weights: WeightPercents
) {
  const params = new URLSearchParams({
    limit: "8",
    minScore: String(minScore),

    wPref: String(weights.preference),
    wHist: String(weights.playHistory),
    wGenre: String(weights.genreLayer),
  });

  return `/api/match/suggestions?${params.toString()}`;
}

/**
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export function MatchSuggestions() {
  const { user, ready } = useAuth();

  /**
   * =======================================================
   * ALGORITHM
   * =======================================================
   */

  const [algorithm, setAlgorithm] =
    useState<Algorithm>("cosine");

  /**
   * =======================================================
   * COSINE DATA
   * =======================================================
   */

  const [cosineData, setCosineData] =
    useState<MatchSuggestionsResponse | null>(null);

  /**
   * =======================================================
   * RECOMMENDATION DATA
   * =======================================================
   */

  const [recommendationData, setRecommendationData] =
    useState<RecommendationResponse | null>(null);

  /**
   * =======================================================
   * COMMON
   * =======================================================
   */

  const [loading, setLoading] = useState(false);

  /**
   * =======================================================
   * COSINE SETTINGS
   * =======================================================
   */

  const [minScorePercent, setMinScorePercent] =
    useState(readStoredMinScore);

  const [weights, setWeights] =
    useState<WeightPercents>(readStoredWeights);

  const [minScoreInput, setMinScoreInput] =
    useState(String(readStoredMinScore()));

  const [weightInputs, setWeightInputs] = useState(() => {
    const stored = readStoredWeights();

    return {
      preference: String(stored.preference),
      playHistory: String(stored.playHistory),
      genreLayer: String(stored.genreLayer),
    };
  });

  /**
   * =======================================================
   * LOAD DATA
   * =======================================================
   */

  useEffect(() => {
    if (!ready || !user) {
      setCosineData(null);
      setRecommendationData(null);
      return;
    }

    let cancelled = false;

    setLoading(true);

    /**
     * =====================================================
     * VECTOR COSINE
     * =====================================================
     */

    if (algorithm === "cosine") {
      apiFetch(
        buildSuggestionsUrl(
          minScorePercent,
          weights
        )
      )
        .then(async (res) => {
          if (!res.ok) {
            const j = await res
              .json()
              .catch(() => ({}));

            throw new Error(
              typeof j.message === "string"
                ? j.message
                : "Không tải được gợi ý Cosine."
            );
          }

          return res.json() as Promise<MatchSuggestionsResponse>;
        })
        .then((result) => {
          if (!cancelled) {
            setCosineData(result);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Lỗi thuật toán Cosine."
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }

    /**
     * =====================================================
     * RECOMMENDATION SYSTEM
     * =====================================================
     */

    else {
      apiFetch(
        "/api/match/teammates?limit=8"
      )
        .then(async (res) => {
          if (!res.ok) {
            const j = await res
              .json()
              .catch(() => ({}));

            throw new Error(
              typeof j.message === "string"
                ? j.message
                : "Không tải được hệ thống gợi ý."
            );
          }

          return res.json() as Promise<RecommendationResponse>;
        })
        .then((result) => {
          if (!cancelled) {
            setRecommendationData(result);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Lỗi hệ thống gợi ý."
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    ready,
    user?._id,
    algorithm,
    minScorePercent,
    weights,
  ]);

  /**
   * =======================================================
   * APPLY COSINE SETTINGS
   * =======================================================
   */

  function applySettings() {
    const nextMin = parsePercentInput(
      minScoreInput,
      minScorePercent
    );

    if (nextMin == null) {
      setMinScoreInput(
        String(minScorePercent)
      );

      toast.error(
        "Độ tương thích: nhập số từ 0 đến 100."
      );

      return;
    }

    const nextPref = parsePercentInput(
      weightInputs.preference,
      weights.preference
    );

    const nextHist = parsePercentInput(
      weightInputs.playHistory,
      weights.playHistory
    );

    const nextGenre = parsePercentInput(
      weightInputs.genreLayer,
      weights.genreLayer
    );

    if (
      nextPref == null ||
      nextHist == null ||
      nextGenre == null
    ) {
      toast.error(
        "Trọng số: nhập số từ 0 đến 100."
      );

      return;
    }

    if (
      nextPref +
      nextHist +
      nextGenre <=
      0
    ) {
      toast.error(
        "Tổng trọng số phải lớn hơn 0."
      );

      return;
    }

    const nextWeights = {
      preference: nextPref,
      playHistory: nextHist,
      genreLayer: nextGenre,
    };

    setMinScorePercent(nextMin);

    setMinScoreInput(
      String(nextMin)
    );

    setWeights(nextWeights);

    setWeightInputs({
      preference: String(nextPref),
      playHistory: String(nextHist),
      genreLayer: String(nextGenre),
    });

    try {
      localStorage.setItem(
        MIN_SCORE_STORAGE_KEY,
        String(nextMin)
      );

      localStorage.setItem(
        WEIGHTS_STORAGE_KEY,
        JSON.stringify(nextWeights)
      );
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * =======================================================
   * AUTH LOADING
   * =======================================================
   */

  if (!ready) {
    return null;
  }

  /**
   * =======================================================
   * NOT LOGIN
   * =======================================================
   */

  if (!user) {
    return (
      <section className="rounded-[14px] border border-[rgb(100_96_255_/_0.25)] bg-gradient-to-br from-[#F1EEFF] to-white p-6 shadow-[0_4px_24px_rgb(100_96_255_/_0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[rgb(100_96_255_/_0.12)] px-3 py-1 pd-text-caption font-bold uppercase tracking-wide text-[#6460FF]">
              <Sparkles
                className="size-3.5"
                aria-hidden
              />

              Gợi ý đồng đội
            </p>

            <h2 className="mt-3 text-h1 text-brand-deep">
              Đăng nhập để nhận gợi ý
            </h2>

            <p className="mt-2 max-w-xl text-body text-text-secondary">
              Hệ thống cung cấp hai phương pháp
              ghép đồng đội: Vector Cosine và
              hệ thống gợi ý.
            </p>
          </div>

          <Link
            to="/signin"
            className={cn(
              buttonVariants({
                variant: "playerduoPrimary",
              }),
              "inline-flex min-h-10 items-center justify-center px-5"
            )}
          >
            Đăng nhập
          </Link>

        </div>
      </section>
    );
  }

  /**
   * =======================================================
   * COSINE DATA
   * =======================================================
   */

  const cosineShown =
    cosineData?.suggestions ?? [];

  const activeMinScore =
    cosineData?.minScorePercent ??
    minScorePercent;

  const activeWeights =
    cosineData?.weights ?? {
      preference:
        weights.preference / 100,

      playHistory:
        weights.playHistory / 100,

      genreLayer:
        weights.genreLayer / 100,
    };

  const weightSum =
    (parseInt(
      weightInputs.preference,
      10
    ) || 0) +

    (parseInt(
      weightInputs.playHistory,
      10
    ) || 0) +

    (parseInt(
      weightInputs.genreLayer,
      10
    ) || 0);

  /**
   * =======================================================
   * RECOMMENDATION DATA
   * =======================================================
   */

  const recommendations =
    recommendationData?.recommendations ??
    recommendationData?.teammates ??
    [];

  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <section className="space-y-5">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[rgb(100_96_255_/_0.12)] px-3 py-1 pd-text-caption font-bold uppercase tracking-wide text-[#6460FF]">

            <Sparkles
              className="size-3.5"
              aria-hidden
            />

            Gợi ý đồng đội
          </p>

          <h2 className="mt-3 text-h1 text-brand-deep">
            Chọn phương pháp ghép đồng đội
          </h2>

          <p className="mt-2 max-w-2xl text-body text-text-secondary">
            Bạn có thể lựa chọn một trong hai
            phương pháp để tìm người chơi phù hợp.
          </p>
        </div>

      </div>

      {/* ===================================================
          ALGORITHM SELECTOR
          =================================================== */}

      <div className="pd-card-default">

        <p className="pd-text-label mb-3 text-[#354052]">
          Phương pháp ghép đồng đội
        </p>

        <div className="grid gap-3 md:grid-cols-2">

          {/* ================= COSINE ================= */}

          <button
            type="button"
            onClick={() =>
              setAlgorithm("cosine")
            }
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              algorithm === "cosine"
                ? "border-[#6460FF] bg-[#F4F1FF] shadow-[0_4px_16px_rgb(100_96_255_/_0.12)]"
                : "border-[#e5e3ec] bg-white hover:border-[#6460FF]/40"
            )}
          >

            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="font-bold text-[#354052]">
                  Vector Cosine
                </p>

                <p className="mt-1 text-sm text-[#666666]">
                  Ghép dựa trên độ tương đồng
                  giữa vector của người chơi.
                </p>
              </div>

              {algorithm === "cosine" && (
                <span className="rounded-full bg-[#6460FF] px-2.5 py-1 text-xs font-bold text-white">
                  Đang chọn
                </span>
              )}

            </div>

          </button>

          {/* ============== RECOMMENDATION ============== */}

          <button
            type="button"
            onClick={() =>
              setAlgorithm(
                "recommendation"
              )
            }
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              algorithm ===
                "recommendation"
                ? "border-[#6460FF] bg-[#F4F1FF] shadow-[0_4px_16px_rgb(100_96_255_/_0.12)]"
                : "border-[#e5e3ec] bg-white hover:border-[#6460FF]/40"
            )}
          >

            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="font-bold text-[#354052]">
                  Hệ thống gợi ý
                </p>

                <p className="mt-1 text-sm text-[#666666]">
                  Phân tích nhiều yếu tố của
                  người chơi để đưa ra đề xuất.
                </p>
              </div>

              {algorithm ===
                "recommendation" && (
                  <span className="rounded-full bg-[#6460FF] px-2.5 py-1 text-xs font-bold text-white">
                    Đang chọn
                  </span>
                )}

            </div>

          </button>

        </div>

      </div>

      {/* ===================================================
          CURRENT ALGORITHM
          =================================================== */}

      {algorithm === "cosine" ? (

        <>
          {/* ================= COSINE SETTINGS ============= */}

          <div className="pd-card-default flex flex-wrap items-end gap-3">

            <div>
              <label
                htmlFor="match-w-pref"
                className="pd-text-label mb-1 block text-[#354052]"
              >
                Sở thích (%)
              </label>

              <input
                id="match-w-pref"
                type="number"
                min={0}
                max={100}
                className="pd-input-field w-24"
                value={
                  weightInputs.preference
                }
                onChange={(e) =>
                  setWeightInputs(
                    (prev) => ({
                      ...prev,
                      preference:
                        e.target.value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label
                htmlFor="match-w-hist"
                className="pd-text-label mb-1 block text-[#354052]"
              >
                Lịch sử (%)
              </label>

              <input
                id="match-w-hist"
                type="number"
                min={0}
                max={100}
                className="pd-input-field w-24"
                value={
                  weightInputs.playHistory
                }
                onChange={(e) =>
                  setWeightInputs(
                    (prev) => ({
                      ...prev,
                      playHistory:
                        e.target.value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label
                htmlFor="match-w-genre"
                className="pd-text-label mb-1 block text-[#354052]"
              >
                Thể loại (%)
              </label>

              <input
                id="match-w-genre"
                type="number"
                min={0}
                max={100}
                className="pd-input-field w-24"
                value={
                  weightInputs.genreLayer
                }
                onChange={(e) =>
                  setWeightInputs(
                    (prev) => ({
                      ...prev,
                      genreLayer:
                        e.target.value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label
                htmlFor="match-min-score"
                className="pd-text-label mb-1 block text-[#354052]"
              >
                Tương thích tối thiểu (%)
              </label>

              <input
                id="match-min-score"
                type="number"
                min={0}
                max={100}
                className="pd-input-field w-24"
                value={minScoreInput}
                onChange={(e) =>
                  setMinScoreInput(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applySettings();
                  }
                }}
              />
            </div>

            <button
              type="button"
              className={cn(
                buttonVariants({
                  variant:
                    "playerduoPrimary",
                }),
                "min-h-10 px-4"
              )}
              onClick={
                applySettings
              }
              disabled={loading}
            >
              Áp dụng
            </button>

            <p className="pd-text-caption w-full text-[#666666]">
              Tổng trọng số:{" "}
              {weightSum}% — hệ thống tự
              chuẩn hoá về 100% khi tính
              toán.
            </p>

          </div>

          {/* ================= COSINE RESULTS =============== */}

          {loading ? (

            <p className="text-body text-text-secondary">
              Đang tính toán bằng Vector
              Cosine...
            </p>

          ) : !cosineShown.length ? (

            <div className="pd-card-default">

              <p className="pd-text-body text-[#354052]">
                Chưa có đủ người chơi hoặc
                điểm tương đồng thấp. Hãy cập
                nhật{" "}
                <Link
                  to="/profile/gaming"
                  className="font-semibold text-[#6460FF] underline"
                >
                  Hồ sơ game
                </Link>
                .
              </p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2">

              {cosineShown.map((s) => (

                <article
                  key={s.user.id}
                  className={cn(
                    "pd-card-default flex flex-col gap-3 transition-shadow",
                    "hover:shadow-[0_8px_24px_-8px_rgb(100_96_255_/_0.25)]"
                  )}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 flex-1 items-center gap-3">

                      <div className="size-12 shrink-0 overflow-hidden rounded-full border-2 border-[#e8e4f5] bg-gradient-to-br from-[#6460FF] to-[#7B19D8]">

                        {s.user.avatarUrl?.trim() ? (

                          <img
                            src={s.user.avatarUrl.trim()}
                            alt=""
                            className="size-full object-cover"
                          />

                        ) : (

                          <div className="flex size-full items-center justify-center text-lg font-black text-white">
                            {s.user.displayName
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>

                        )}

                      </div>

                      <div className="min-w-0">

                        <h3 className="pd-text-h3 truncate text-[#354052]">
                          {s.user.displayName}
                        </h3>

                        <p className="pd-text-caption text-[#999999]">
                          @{s.user.username}
                        </p>

                      </div>

                    </div>

                    <span className="shrink-0 rounded-[10px] bg-[#280071] px-3 py-1.5 text-sm font-black text-white">
                      {s.scorePercent}%
                    </span>

                  </div>

                  <div className="flex flex-wrap gap-1.5">

                    {s.explanation.labels.length ? (

                      s.explanation.labels.map(
                        (label) => (
                          <span
                            key={label}
                            className="rounded-full border border-[#20AEFF]/40 bg-[rgb(32_174_255_/_0.12)] px-2 py-0.5 pd-text-caption font-semibold text-[#0066cc]"
                          >
                            Cùng thích:{" "}
                            {label}
                          </span>
                        )
                      )

                    ) : (

                      <span className="pd-text-caption text-[#666666]">
                        Trùng khớp theo thể loại /
                        giờ chơi
                      </span>

                    )}

                    {s.explanation.sharedGenres
                      .slice(0, 3)
                      .map((genre) => (

                        <span
                          key={genre}
                          className="rounded-full bg-muted px-2 py-0.5 pd-text-caption font-medium text-[#354052]"
                        >
                          {genre}
                        </span>

                      ))}

                  </div>

                  {s.user.bio ? (
                    <p className="pd-text-body-sm line-clamp-2 text-[#666666]">
                      {s.user.bio}
                    </p>
                  ) : null}

                  <div className="mt-auto flex gap-2 pt-1">

                    <Link
                      to={`/players/${encodeURIComponent(
                        s.user.username
                      )}`}
                      className={cn(
                        buttonVariants({
                          variant:
                            "outline",
                        }),
                        "flex-1"
                      )}
                    >
                      Xem hồ sơ
                    </Link>

                    <Link
                      to={`/players/${encodeURIComponent(
                        s.user.username
                      )}`}
                      className={cn(
                        buttonVariants({
                          variant:
                            "playerduoPrimary",
                        }),
                        "flex-1"
                      )}
                    >
                      Xem người chơi
                    </Link>

                  </div>

                </article>

              ))}

            </div>

          )}

        </>

      ) : (

        <>
          {/* ===============================================
              RECOMMENDATION INFO
              =============================================== */}

          <div className="rounded-[14px] border border-[rgb(100_96_255_/_0.18)] bg-gradient-to-r from-[#F4F1FF] to-white p-4">

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">

              <div>
                <span className="pd-text-caption text-[#777777]">
                  Phương pháp
                </span>

                <p className="font-bold text-[#354052]">
                  Hệ thống gợi ý dựa trên nội dung
                </p>
              </div>

              <div>
                <span className="pd-text-caption text-[#777777]">
                  Sở thích
                </span>

                <p className="font-semibold text-[#354052]">
                  {Math.round(
                    (recommendationData?.weights
                      .favorite ?? 0) * 100
                  )}
                  %
                </p>
              </div>

              <div>
                <span className="pd-text-caption text-[#777777]">
                  Lịch sử chơi
                </span>
                <p className="font-semibold text-[#354052]">
                  {Math.round(
                    (recommendationData?.weights
                      .playHistory ?? 0) * 100
                  )}
                  %
                </p>
              </div>

              <div>
                <span className="pd-text-caption text-[#777777]">
                  Rank
                </span>
                <p className="font-semibold text-[#354052]">
                  {Math.round(
                    (recommendationData?.weights
                      .playHistory ?? 0) * 100
                  )}
                  %
                </p>
              </div>

              <div>
                <span className="pd-text-caption text-[#777777]">
                  Hoạt động
                </span>

                <p className="font-semibold text-[#354052]">
                  {Math.round(
                    (recommendationData?.weights
                      .activity ?? 0) * 100
                  )}
                  %
                </p>
              </div>

              <div>
                <span className="pd-text-caption text-[#777777]">
                  Sessions
                </span>

                <p className="font-semibold text-[#354052]">
                  {Math.round(
                    (recommendationData?.weights
                      .sessions ?? 0) * 100
                  )}
                  %
                </p>
              </div>

            </div>

          </div>

          {/* ===============================================
              RECOMMENDATION RESULT
              =============================================== */}

          {loading ? (

            <div className="pd-card-default">

              <div className="flex items-center gap-3">

                <div className="size-5 animate-spin rounded-full border-2 border-[#6460FF] border-t-transparent" />

                <p className="text-body text-text-secondary">
                  Đang phân tích hồ sơ để tìm
                  đồng đội phù hợp...
                </p>

              </div>

            </div>

          ) : !recommendations.length ? (

            <div className="pd-card-default">

              <h3 className="pd-text-h3 text-[#354052]">
                Chưa có đủ dữ liệu để đề xuất
              </h3>

              <p className="mt-1 pd-text-body-sm text-[#666666]">
                Hãy cập nhật game yêu thích
                và lịch sử chơi để hệ thống có
                thêm dữ liệu phân tích.
              </p>

              <div className="mt-3">

                <Link
                  to="/profile/gaming"
                  className={cn(
                    buttonVariants({
                      variant:
                        "playerduoPrimary",
                    }),
                    "inline-flex"
                  )}
                >
                  Cập nhật hồ sơ game
                </Link>

              </div>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2">

              {recommendations.map(
                (item) => {

                  const displayName =
                    item.user.displayName ||
                    "Người chơi";

                  const username =
                    item.user.username ||
                    "user";

                  const avatar =
                    item.user.avatarUrl?.trim();

                  return (

                    <article
                      key={item.user.id}
                      className={cn(
                        "pd-card-default flex flex-col gap-4 transition-shadow",
                        "hover:shadow-[0_8px_24px_-8px_rgb(100_96_255_/_0.25)]"
                      )}
                    >

                      {/* USER */}

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex min-w-0 flex-1 items-center gap-3">

                          <div className="size-12 shrink-0 overflow-hidden rounded-full border-2 border-[#e8e4f5] bg-gradient-to-br from-[#6460FF] to-[#7B19D8]">

                            {avatar ? (

                              <img
                                src={avatar}
                                alt=""
                                className="size-full object-cover"
                              />

                            ) : (

                              <div className="flex size-full items-center justify-center text-lg font-black text-white">
                                {displayName
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>

                            )}

                          </div>

                          <div className="min-w-0">

                            <h3 className="pd-text-h3 truncate text-[#354052]">
                              {displayName}
                            </h3>

                            <p className="pd-text-caption text-[#999999]">
                              @{username}
                            </p>

                          </div>

                        </div>

                        <span className="shrink-0 rounded-[10px] bg-[#280071] px-3 py-1.5 text-sm font-black text-white">
                          {item.scorePercent}%
                        </span>

                      </div>

                      {/* REASONS */}

                      {item.explanation
                        .reasons
                        .length > 0 && (

                          <div className="flex flex-wrap gap-1.5">

                            {item.explanation
                              .reasons
                              .map(
                                (reason) => (

                                  <span
                                    key={reason}
                                    className="rounded-full border border-[#20AEFF]/40 bg-[rgb(32_174_255_/_0.12)] px-2 py-0.5 pd-text-caption font-semibold text-[#0066cc]"
                                  >
                                    {reason}
                                  </span>

                                )
                              )}

                          </div>

                        )}

                      {/* BREAKDOWN */}

                      <div className="grid grid-cols-2 gap-3">

                        <RecommendationBar
                          label="Sở thích"
                          value={
                            item.breakdown.favorite
                          }
                        />

                        <RecommendationBar
                          label="Lịch sử"
                          value={
                            item.breakdown.history
                          }
                        />

                        <RecommendationBar
                          label="Rank"
                          value={
                            item.breakdown.rank
                          }
                        />

                        <RecommendationBar
                          label="Hoạt động"
                          value={
                            item.breakdown.activity
                          }
                        />

                        <RecommendationBar
                          label="Sessions"
                          value={
                            item.breakdown.sessions
                          }
                        />

                      </div>

                      {/* SHARED FAVORITE */}

                      {item.explanation
                        .sharedFavoriteGames
                        .length > 0 && (

                          <div>

                            <p className="mb-1.5 text-xs font-semibold text-[#666666]">
                              Game cùng yêu thích
                            </p>

                            <div className="flex flex-wrap gap-1.5">

                              {item.explanation
                                .sharedFavoriteGames
                                .map(
                                  (game) => (

                                    <span
                                      key={`favorite-${game}`}
                                      className="rounded-full border border-[#6460FF]/30 bg-[#6460FF]/10 px-2.5 py-1 text-xs font-semibold text-[#6460FF]"
                                    >
                                      🎮 {game}
                                    </span>

                                  )
                                )}

                            </div>

                          </div>

                        )}

                      {/* SHARED HISTORY */}

                      {item.explanation
                        .sharedHistoryGames
                        .length > 0 && (

                          <div>

                            <p className="mb-1.5 text-xs font-semibold text-[#666666]">
                              Game từng chơi chung
                            </p>

                            <div className="flex flex-wrap gap-1.5">

                              {item.explanation
                                .sharedHistoryGames
                                .map(
                                  (game) => (

                                    <span
                                      key={`history-${game}`}
                                      className="rounded-full border border-[#20AEFF]/30 bg-[#20AEFF]/10 px-2.5 py-1 text-xs font-semibold text-[#0066cc]"
                                    >
                                      🕹️ {game}
                                    </span>

                                  )
                                )}

                            </div>

                          </div>

                        )}

                      {/* BIO */}

                      {item.user.bio ? (

                        <p className="pd-text-body-sm line-clamp-2 text-[#666666]">
                          {item.user.bio}
                        </p>

                      ) : null}

                      {/* ACTIONS */}

                      <div className="mt-auto flex gap-2 pt-1">

                        <Link
                          to={`/players/${encodeURIComponent(
                            username
                          )}`}
                          className={cn(
                            buttonVariants({
                              variant:
                                "outline",
                            }),
                            "flex-1"
                          )}
                        >
                          Xem hồ sơ
                        </Link>

                        <Link
                          to={`/players/${encodeURIComponent(
                            username
                          )}`}
                          className={cn(
                            buttonVariants({
                              variant:
                                "playerduoPrimary",
                            }),
                            "flex-1"
                          )}
                        >
                          Xem người chơi
                        </Link>

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        </>

      )}

    </section>
  );
}

/**
 * =========================================================
 * RECOMMENDATION BAR
 * =========================================================
 */

function RecommendationBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>

      <div className="mb-1 flex justify-between text-xs">

        <span className="text-[#666666]">
          {label}
        </span>

        <strong className="text-[#354052]">
          {value}%
        </strong>

      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#e6e4ee]">

        <div
          className="h-full rounded-full bg-[#6460FF]"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, value)
            )}%`,
          }}
        />

      </div>

    </div>
  );
}