import type { PrismaClient, Frame } from "@prisma/client";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Picks one frame, preferring one the user hasn't seen yet. */
function pickOne(frames: Frame[], seenIds: Set<number>): Frame {
  const unseen = shuffle(frames.filter((f) => !seenIds.has(f.id)));
  if (unseen.length > 0) return unseen[0];
  return shuffle(frames)[0];
}

export interface FramePair {
  hard: Frame;
  easy: Frame;
}

/**
 * Picks up to `totalRounds` hard+easy frame pairs, one per film, for a
 * session. Each round shows a film's hard frame first and, on a wrong
 * answer, that same film's easy frame — so only films with at least one
 * active hard AND one active easy frame are eligible. Prefers pairs the user
 * hasn't seen and avoids repeating a film within a session, but cycles
 * through what's available rather than shrinking the session when the
 * eligible-film pool is smaller than `totalRounds`.
 */
export async function selectFramesForSession(
  prisma: PrismaClient,
  userId: number,
  totalRounds = 10
): Promise<FramePair[]> {
  const seen = await prisma.userSeenFrame.findMany({
    where: { userId },
    select: { frameId: true },
  });
  const seenIds = new Set(seen.map((s) => s.frameId));

  const frames = await prisma.frame.findMany({
    where: { isActive: true, film: { isActive: true }, difficulty: { in: ["hard", "easy"] } },
  });

  const byFilm = new Map<number, { hard: Frame[]; easy: Frame[] }>();
  for (const f of frames) {
    const entry = byFilm.get(f.filmId) ?? { hard: [], easy: [] };
    entry[f.difficulty === "hard" ? "hard" : "easy"].push(f);
    byFilm.set(f.filmId, entry);
  }

  const pairs: FramePair[] = [...byFilm.values()]
    .filter((v) => v.hard.length > 0 && v.easy.length > 0)
    .map((v) => ({ hard: pickOne(v.hard, seenIds), easy: pickOne(v.easy, seenIds) }));

  const fullyUnseen = shuffle(pairs.filter((p) => !seenIds.has(p.hard.id) && !seenIds.has(p.easy.id)));
  const partiallySeen = shuffle(pairs.filter((p) => seenIds.has(p.hard.id) || seenIds.has(p.easy.id)));

  const selected: FramePair[] = [];
  const usedFilmIds = new Set<number>();
  for (const pool of [fullyUnseen, partiallySeen]) {
    for (const pair of pool) {
      if (selected.length >= totalRounds) break;
      if (usedFilmIds.has(pair.hard.filmId)) continue;
      selected.push(pair);
      usedFilmIds.add(pair.hard.filmId);
    }
  }

  // Fewer eligible films than totalRounds (small content pool): cycle
  // through what's available rather than shrinking the session.
  if (selected.length < totalRounds && pairs.length > 0) {
    const cycle = shuffle(pairs);
    let i = 0;
    while (selected.length < totalRounds) {
      selected.push(cycle[i % cycle.length]);
      i++;
    }
  }

  return selected.slice(0, totalRounds);
}
