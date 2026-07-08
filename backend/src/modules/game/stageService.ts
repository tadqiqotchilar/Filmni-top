import type { PrismaClient } from "@prisma/client";
import { GameError } from "./gameErrors.js";

export interface EligibleFilm {
  id: number;
  titleUz: string;
  titleRu: string;
  titleOriginal: string;
  year: number;
  posterUrl: string | null;
  stage: number;
}

function localizedTitle(film: { titleUz: string; titleRu: string; titleOriginal: string }, language: string) {
  if (language === "ru") return film.titleRu || film.titleOriginal;
  return film.titleUz || film.titleOriginal;
}

/**
 * A film only counts toward the stage system once it's playable: active,
 * assigned a stage, and has at least one active frame at each difficulty.
 * A film with a stage but incomplete content is silently excluded so it
 * can never permanently block that stage's completion.
 */
async function getEligibleStageFilms(prisma: PrismaClient): Promise<EligibleFilm[]> {
  const films = await prisma.film.findMany({
    where: { isActive: true, stage: { not: null } },
    include: { frames: { where: { isActive: true } } },
    orderBy: [{ stage: "asc" }, { id: "asc" }],
  });

  return films
    .filter((f) => {
      const diffs = new Set(f.frames.map((fr) => fr.difficulty));
      return diffs.has("hard") && diffs.has("medium") && diffs.has("easy");
    })
    .map((f) => ({
      id: f.id,
      titleUz: f.titleUz,
      titleRu: f.titleRu,
      titleOriginal: f.titleOriginal,
      year: f.year,
      posterUrl: f.posterUrl,
      stage: f.stage!,
    }));
}

export interface StageChainEntry {
  stage: number;
  films: EligibleFilm[];
  solvedFilmIds: Set<number>;
  complete: boolean;
  unlocked: boolean;
}

/**
 * Pure chain builder: given the eligible stage-assigned films and which film
 * ids a user has solved, builds the full 1..maxStage chain. Iterates the
 * contiguous integer range (not just the stage numbers actually present) so
 * a stage with 0 eligible films is auto-satisfied and skipped rather than a
 * dead end. Stage 1 is always unlocked. Exported standalone (no PrismaClient
 * dependency) so the unlock logic can be unit tested with plain fixtures.
 */
export function buildStageChain(eligibleFilms: EligibleFilm[], solvedSet: Set<number>): StageChainEntry[] {
  const maxStage = eligibleFilms.reduce((m, f) => Math.max(m, f.stage), 0);
  if (maxStage === 0) return [];

  const byStage = new Map<number, EligibleFilm[]>();
  for (const f of eligibleFilms) {
    const arr = byStage.get(f.stage) ?? [];
    arr.push(f);
    byStage.set(f.stage, arr);
  }

  const chain: StageChainEntry[] = [];
  let previousUnlockedAndComplete = true;
  for (let n = 1; n <= maxStage; n++) {
    const films = byStage.get(n) ?? [];
    const complete = films.length === 0 || films.every((f) => solvedSet.has(f.id));
    const unlocked: boolean = previousUnlockedAndComplete;
    chain.push({ stage: n, films, solvedFilmIds: solvedSet, complete, unlocked });
    previousUnlockedAndComplete = unlocked && complete;
  }
  return chain;
}

export async function computeStageChain(prisma: PrismaClient, userId: number): Promise<StageChainEntry[]> {
  const eligibleFilms = await getEligibleStageFilms(prisma);
  if (eligibleFilms.length === 0) return [];

  const filmIds = eligibleFilms.map((f) => f.id);
  const solvedRows = await prisma.userFilmProgress.findMany({
    where: { userId, filmId: { in: filmIds } },
    select: { filmId: true },
  });
  const solvedSet = new Set(solvedRows.map((r) => r.filmId));

  return buildStageChain(eligibleFilms, solvedSet);
}

export interface StageFilmDto {
  filmId: number;
  solved: boolean;
  locked: boolean;
  title?: string;
  year?: number;
  posterUrl?: string | null;
}

export interface StageDto {
  stage: number;
  unlocked: boolean;
  complete: boolean;
  totalFilms: number;
  solvedCount: number;
  films: StageFilmDto[];
}

export async function getStagesOverview(
  prisma: PrismaClient,
  userId: number,
  language: string
): Promise<{ stages: StageDto[] }> {
  const chain = await computeStageChain(prisma, userId);

  const stages = chain
    .filter((entry) => entry.films.length > 0)
    .map((entry) => {
      let allPriorSolved = true;
      const films: StageFilmDto[] = entry.films.map((f) => {
        const solved = entry.solvedFilmIds.has(f.id);
        const locked = !solved && !allPriorSolved;
        allPriorSolved = allPriorSolved && solved;
        if (!solved) return { filmId: f.id, solved: false, locked };
        return {
          filmId: f.id,
          solved: true,
          locked: false,
          title: localizedTitle(f, language),
          year: f.year,
          posterUrl: f.posterUrl,
        };
      });
      return {
        stage: entry.stage,
        unlocked: entry.unlocked,
        complete: entry.complete,
        totalFilms: entry.films.length,
        solvedCount: films.filter((f) => f.solved).length,
        films,
      };
    });

  return { stages };
}

/**
 * Guards POST /api/game/start: throws if the film isn't part of an unlocked
 * stage, or if the user has already solved it (solved films are locked from
 * replay in the picker, enforced here too, not just in the UI).
 */
export async function assertFilmPlayable(prisma: PrismaClient, userId: number, filmId: number): Promise<void> {
  const film = await prisma.film.findUnique({ where: { id: filmId } });
  if (!film || !film.isActive) throw new GameError("film_not_found", 404);
  if (film.stage == null) throw new GameError("film_not_in_stage", 400);

  const alreadySolved = await prisma.userFilmProgress.findUnique({
    where: { userId_filmId: { userId, filmId } },
  });
  if (alreadySolved) throw new GameError("film_already_solved", 400);

  const chain = await computeStageChain(prisma, userId);
  const entry = chain.find((e) => e.stage === film.stage);
  const filmIndex = entry?.films.findIndex((f) => f.id === filmId) ?? -1;
  if (!entry || filmIndex === -1) {
    // Stage exists but this film isn't (yet) eligible content-wise.
    throw new GameError("film_not_playable", 400);
  }
  if (!entry.unlocked) throw new GameError("stage_locked", 403);

  const allPriorSolved = entry.films
    .slice(0, filmIndex)
    .every((f) => entry.solvedFilmIds.has(f.id));
  if (!allPriorSolved) throw new GameError("film_locked", 403);
}

export interface StageProgressDelta {
  filmSolved: boolean;
  stageCompleted: boolean;
  nextStageUnlocked: boolean;
}

/** Call AFTER the UserFilmProgress row for filmId has been written. */
export async function computeStageProgressDelta(
  prisma: PrismaClient,
  userId: number,
  filmId: number
): Promise<StageProgressDelta> {
  const film = await prisma.film.findUnique({ where: { id: filmId } });
  if (!film || film.stage == null) return { filmSolved: true, stageCompleted: false, nextStageUnlocked: false };

  const chain = await computeStageChain(prisma, userId);
  const entryIndex = chain.findIndex((e) => e.stage === film.stage);
  if (entryIndex === -1) return { filmSolved: true, stageCompleted: false, nextStageUnlocked: false };

  const entry = chain[entryIndex];
  const next = chain[entryIndex + 1];
  return {
    filmSolved: true,
    stageCompleted: entry.complete,
    nextStageUnlocked: entry.complete && (next?.unlocked ?? false),
  };
}
