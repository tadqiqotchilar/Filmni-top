import type { AdminFilm, AdminFrame, AdminStats, Difficulty, FilmInput } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

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
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, body.error ?? "unknown_error");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (password: string) =>
    request<{ token: string }>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  listFilms: () => request<{ films: AdminFilm[] }>("/api/admin/films"),

  getFilm: (id: number) => request<{ film: AdminFilm }>(`/api/admin/films/${id}`),

  createFilm: (data: FilmInput) =>
    request<{ film: AdminFilm }>("/api/admin/films", { method: "POST", body: JSON.stringify(data) }),

  updateFilm: (id: number, data: Partial<FilmInput> & { isActive?: boolean }) =>
    request<{ film: AdminFilm }>(`/api/admin/films/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteFilm: (id: number) => request<void>(`/api/admin/films/${id}`, { method: "DELETE" }),

  uploadFrame: (filmId: number, file: File, difficulty: Difficulty) => {
    const form = new FormData();
    form.append("image", file);
    form.append("difficulty", difficulty);
    return request<{ frame: AdminFrame }>(`/api/admin/films/${filmId}/frames`, {
      method: "POST",
      body: form,
    });
  },

  updateFrame: (id: number, data: { difficulty?: Difficulty; isActive?: boolean }) =>
    request<{ frame: AdminFrame }>(`/api/admin/frames/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteFrame: (id: number) =>
    request<{ softDeleted: boolean }>(`/api/admin/frames/${id}`, { method: "DELETE" }),

  stats: () => request<AdminStats>("/api/admin/stats"),
};

export function frameImageUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}
