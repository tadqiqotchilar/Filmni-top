// Scoring engine: TZ 3.2 (hints) and 3.4 (points).

export const HINT_COSTS = {
  firstLetter: 10,
  year: 15,
  genre: 10,
  lettersCount: 5,
} as const;

export type HintType = keyof typeof HINT_COSTS;

export const ROUND_SECONDS = 60;
export const BASE_SCORE_FIRST_ATTEMPT = 100;
export const BASE_SCORE_SECOND_ATTEMPT = 50;
export const MAX_SPEED_BONUS = 55;
export const STREAK_THRESHOLD = 3;
export const STREAK_BASE_BONUS = 20;
export const STREAK_STEP_BONUS = 10;

export function calculateHintsCost(hints: HintType[]): number {
  return hints.reduce((sum, hint) => sum + HINT_COSTS[hint], 0);
}

export function calculateSpeedBonus(remainingSeconds: number): number {
  return Math.max(0, Math.min(MAX_SPEED_BONUS, Math.round(remainingSeconds)));
}

/** streakCount = consecutive correct answers including the current one. */
export function calculateStreakBonus(streakCount: number): number {
  if (streakCount < STREAK_THRESHOLD) return 0;
  return STREAK_BASE_BONUS + (streakCount - STREAK_THRESHOLD) * STREAK_STEP_BONUS;
}

export interface RoundScoreInput {
  isCorrect: boolean;
  attemptNumber: 1 | 2;
  remainingSeconds: number;
  streakCount: number;
  hintsUsed: HintType[];
}

export interface RoundScoreResult {
  baseScore: number;
  speedBonus: number;
  streakBonus: number;
  hintsCost: number;
  total: number;
}

/**
 * Full round score per TZ 3.4. Hint costs are deducted regardless of the
 * outcome (the player already spent points to see the hint); the
 * base/speed/streak bonuses only apply on a correct answer.
 */
export function calculateRoundScore(input: RoundScoreInput): RoundScoreResult {
  const hintsCost = calculateHintsCost(input.hintsUsed);

  if (!input.isCorrect) {
    return { baseScore: 0, speedBonus: 0, streakBonus: 0, hintsCost, total: -hintsCost };
  }

  const baseScore =
    input.attemptNumber === 1 ? BASE_SCORE_FIRST_ATTEMPT : BASE_SCORE_SECOND_ATTEMPT;
  const speedBonus = calculateSpeedBonus(input.remainingSeconds);
  const streakBonus = calculateStreakBonus(input.streakCount);
  const total = baseScore + speedBonus + streakBonus - hintsCost;

  return { baseScore, speedBonus, streakBonus, hintsCost, total };
}
