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

export interface FrameTriple {
  hard: Frame;
  medium: Frame;
  easy: Frame;
}

/**
 * Picks up to `totalRounds` hard+medium+easy frame triples, one per film, for
 * a session. Each round shows a film's hard frame first, then (on a wrong
 * answer) that same film's medium frame, then its easy frame — so only films
 * with at least one active frame at all three difficulties are eligible.
 * Prefers triples the user hasn't seen and avoids repeating a film within a
 * session, but cycles through what's available rather than shrinking the
 * session when the eligible-film pool is smaller than `totalRounds`.
 */
export async function selectFramesForSession(
  prisma: PrismaClient,
  userId: number,
  totalRounds = 10
): Promise<FrameTriple[]> {
  const seen = await prisma.userSeenFrame.findMany({
    where: { userId },
    select: { frameId: true },
  });
  const seenIds = new Set(seen.map((s) => s.frameId));

  const frames = await prisma.frame.findMany({
    where: { isActive: true, film: { isActive: true }, difficulty: { in: ["hard", "medium", "easy"] } },
  });

  const byFilm = new Map<number, { hard: Frame[]; medium: Frame[]; easy: Frame[] }>();
  for (const f of frames) {
    const entry = byFilm.get(f.filmId) ?? { hard: [], medium: [], easy: [] };
    if (f.difficulty === "hard") entry.hard.push(f);
    else if (f.difficulty === "medium") entry.medium.push(f);
    else entry.easy.push(f);
    byFilm.set(f.filmId, entry);
  }

  const triples: FrameTriple[] = [...byFilm.values()]
    .filter((v) => v.hard.length > 0 && v.medium.length > 0 && v.easy.length > 0)
    .map((v) => ({
      hard: pickOne(v.hard, seenIds),
      medium: pickOne(v.medium, seenIds),
      easy: pickOne(v.easy, seenIds),
    }));

  const isUnseen = (t: FrameTriple) =>
    !seenIds.has(t.hard.id) && !seenIds.has(t.medium.id) && !seenIds.has(t.easy.id);
  const fullyUnseen = shuffle(triples.filter(isUnseen));
  const partiallySeen = shuffle(triples.filter((t) => !isUnseen(t)));

  const selected: FrameTriple[] = [];
  const usedFilmIds = new Set<number>();
  for (const pool of [fullyUnseen, partiallySeen]) {
    for (const triple of pool) {
      if (selected.length >= totalRounds) break;
      if (usedFilmIds.has(triple.hard.filmId)) continue;
      selected.push(triple);
      usedFilmIds.add(triple.hard.filmId);
    }
  }

  // Fewer eligible films than totalRounds (small content pool): cycle
  // through what's available rather than shrinking the session.
  if (selected.length < totalRounds && triples.length > 0) {
    const cycle = shuffle(triples);
    let i = 0;
    while (selected.length < totalRounds) {
      selected.push(cycle[i % cycle.length]);
      i++;
    }
  }

  return selected.slice(0, totalRounds);
}
