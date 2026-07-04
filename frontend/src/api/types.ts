export type Language = "uz" | "ru";
export type Difficulty = "easy" | "medium" | "hard";
export type HintType = "firstLetter" | "year" | "genre" | "lettersCount";

export interface AuthResponse {
  token: string;
  user: MeResponse;
}

export interface MeResponse {
  id: number;
  username: string | null;
  firstName: string | null;
  avatarUrl?: string | null;
  language: Language;
  totalScore: number;
  gamesPlayed: number;
}

export interface FrameDto {
  frameId: number;
  imageUrl: string;
  difficulty: Difficulty;
}

export interface StartSessionResponse {
  sessionId: number;
  totalRounds: number;
  roundIndex: number;
  attemptsLeft: number;
  timeLimitSeconds: number;
  frame: FrameDto;
}

export interface SessionStateResponse {
  sessionId: number;
  totalRounds: number;
  roundIndex: number;
  totalScore: number;
  correctCount: number;
  attemptsLeft: number;
  remainingSeconds: number;
  frame: FrameDto;
}

export interface ScoreBreakdown {
  baseScore: number;
  speedBonus: number;
  streakBonus: number;
  hintsCost: number;
  total: number;
}

export interface AnswerResponse {
  isCorrect: boolean;
  timedOut?: boolean;
  attemptsLeft?: number;
  roundFinished?: boolean;
  /** Same-round retry image (that film's easy frame) after a wrong attempt 1. */
  retryFrame?: FrameDto | null;
  score?: number;
  breakdown?: ScoreBreakdown;
  correctTitle?: string;
  year?: number;
  posterUrl?: string | null;
  isSessionDone?: boolean;
  /** Next round's (new film's hard) frame, once this round is finished. */
  nextFrame?: FrameDto | null;
  roundIndex?: number;
  sessionSummary?: {
    totalScore: number;
    correctCount: number;
    totalRounds: number;
  };
}

export interface HintResponse {
  hintType: HintType;
  value: string | number;
  cost: number;
  costSoFar: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  username: string | null;
  firstName: string | null;
  avatarUrl: string | null;
  score: number;
}

export interface LeaderboardResponse {
  period: "all" | "weekly";
  entries: LeaderboardEntry[];
  me: { rank: number; score: number } | null;
}

export interface ApiErrorBody {
  error: string;
}
