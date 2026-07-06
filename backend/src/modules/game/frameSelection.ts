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
 * Picks the hard+medium+easy frame triple for one specific film (the film a
 * player chose from a stage's picker), preferring frames the user hasn't
 * seen yet when a difficulty has more than one active frame. Returns null if
 * the film doesn't have an active frame at every difficulty.
 */
export async function selectTripleForFilm(
  prisma: PrismaClient,
  userId: number,
  filmId: number
): Promise<FrameTriple | null> {
  const seen = await prisma.userSeenFrame.findMany({
    where: { userId },
    select: { frameId: true },
  });
  const seenIds = new Set(seen.map((s) => s.frameId));

  const frames = await prisma.frame.findMany({
    where: { filmId, isActive: true, difficulty: { in: ["hard", "medium", "easy"] } },
  });

  const hard = frames.filter((f) => f.difficulty === "hard");
  const medium = frames.filter((f) => f.difficulty === "medium");
  const easy = frames.filter((f) => f.difficulty === "easy");
  if (hard.length === 0 || medium.length === 0 || easy.length === 0) return null;

  return {
    hard: pickOne(hard, seenIds),
    medium: pickOne(medium, seenIds),
    easy: pickOne(easy, seenIds),
  };
}
