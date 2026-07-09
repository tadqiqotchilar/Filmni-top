export type Difficulty = "easy" | "medium" | "hard";

export interface AdminFrame {
  id: number;
  filmId: number;
  imageUrl: string;
  difficulty: Difficulty;
  isActive: boolean;
}

export interface AdminFilm {
  id: number;
  titleOriginal: string;
  titleUz: string;
  titleRu: string;
  year: number;
  genre: string;
  posterUrl: string | null;
  isActive: boolean;
  stage: number | null;
  aliases: string[];
  frameCount?: number;
  frames?: AdminFrame[];
}

export interface AdminTopPlayer {
  id: number;
  username: string | null;
  firstName: string | null;
  totalScore: number;
  gamesPlayed: number;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  finishedSessions: number;
  totalFilms: number;
  totalFrames: number;
  topPlayers: AdminTopPlayer[];
}

export interface AdminResetResult {
  usersReset: number;
  sessionsDeleted: number;
  progressDeleted: number;
  seenFramesDeleted: number;
  weeklyScoresDeleted: number;
}

export interface FilmInput {
  titleOriginal: string;
  titleUz: string;
  titleRu: string;
  year: number;
  genre: string;
  posterUrl?: string;
  stage?: number | null;
  aliases: string[];
}
