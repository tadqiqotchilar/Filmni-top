import type {
  AnswerResponse,
  AuthResponse,
  HintResponse,
  HintType,
  LeaderboardResponse,
  MeResponse,
  SessionStateResponse,
  StagesResponse,
  StartSessionResponse,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, body.error ?? "unknown_error");
  }

  return res.json() as Promise<T>;
}

export const api = {
  auth: (initData: string) =>
    request<AuthResponse>("/api/auth", { method: "POST", body: JSON.stringify({ initData }) }),

  me: () => request<MeResponse>("/api/me"),

  updateSettings: (language: "uz" | "ru") =>
    request<{ id: number; language: string }>("/api/me/settings", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    }),

  resetGame: () => request<MeResponse>("/api/me/reset", { method: "POST" }),

  startGame: (filmId: number, signal?: AbortSignal) =>
    request<StartSessionResponse>("/api/game/start", {
      method: "POST",
      body: JSON.stringify({ filmId }),
      signal,
    }),

  getStages: () => request<StagesResponse>("/api/stages"),

  submitAnswer: (sessionId: number, answerText: string) =>
    request<AnswerResponse>("/api/game/answer", {
      method: "POST",
      body: JSON.stringify({ sessionId, answerText }),
    }),

  useHint: (sessionId: number, hintType: HintType) =>
    request<HintResponse>("/api/game/hint", {
      method: "POST",
      body: JSON.stringify({ sessionId, hintType }),
    }),

  getSession: (sessionId: number) =>
    request<SessionStateResponse>(`/api/game/session/${sessionId}`),

  leaderboard: (period: "all" | "weekly") =>
    request<LeaderboardResponse>(`/api/leaderboard?period=${period}`),
};

export function frameImageUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}
