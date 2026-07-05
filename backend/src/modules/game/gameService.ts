import type { Frame, PrismaClient } from "@prisma/client";
import { matchAnswer } from "../../lib/matching.js";
import {
  calculateRoundScore,
  ROUND_SECONDS,
  HINT_COSTS,
  type HintType,
} from "../../lib/scoring.js";
import { selectFramesForSession } from "./frameSelection.js";

const TOTAL_ATTEMPTS = 3;

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

// Server-side grace window on top of the 60s round timer (TZ 6.3).
const LATE_ANSWER_GRACE_SECONDS = 5;

export class GameError extends Error {
  constructor(public code: string, public statusCode = 400) {
    super(code);
  }
}

function localizedTitle(film: { titleUz: string; titleRu: string; titleOriginal: string }, language: string) {
  if (language === "ru") return film.titleRu || film.titleOriginal;
  return film.titleUz || film.titleOriginal;
}

function filmAliases(film: { titleOriginal: string; titleUz: string; titleRu: string; aliases: { alias: string }[] }) {
  return [film.titleOriginal, film.titleUz, film.titleRu, ...film.aliases.map((a) => a.alias)].filter(Boolean);
}

async function loadActiveRound(prisma: PrismaClient, sessionId: number) {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new GameError("session_not_found", 404);
  if (session.status !== "active") throw new GameError("session_finished", 409);

  const round = await prisma.round.findFirst({
    where: { sessionId, roundIndex: session.currentRound },
    include: {
      frame: { include: { film: { include: { aliases: true } } } },
      secondFrame: true,
      thirdFrame: true,
    },
  });
  if (!round) throw new GameError("round_not_found", 404);

  return { session, round };
}

function elapsedSeconds(startedAt: Date): number {
  return (Date.now() - startedAt.getTime()) / 1000;
}

function frameDto(frame: { id: number; imageUrl: string; difficulty: string }) {
  return { frameId: frame.id, imageUrl: frame.imageUrl, difficulty: frame.difficulty };
}

/** Hard frame on attempt 1, that film's medium frame on attempt 2, easy frame on attempt 3. */
function frameInPlay(
  round: { frame: Frame; secondFrame: Frame | null; thirdFrame: Frame | null },
  attemptNumber: 1 | 2 | 3
): Frame {
  if (attemptNumber === 1) return round.frame;
  if (attemptNumber === 2) return round.secondFrame ?? round.frame;
  return round.thirdFrame ?? round.secondFrame ?? round.frame;
}

async function markFrameSeen(prisma: PrismaClient, userId: number, frameId: number) {
  await prisma.userSeenFrame.upsert({
    where: { userId_frameId: { userId, frameId } },
    update: {},
    create: { userId, frameId },
  });
}

export async function startSession(prisma: PrismaClient, userId: number, totalRounds = 10) {
  await prisma.gameSession.updateMany({
    where: { userId, status: "active" },
    data: { status: "finished", finishedAt: new Date() },
  });

  const triples = await selectFramesForSession(prisma, userId, totalRounds);
  if (triples.length === 0) {
    throw new GameError("no_content_available", 503);
  }

  const session = await prisma.gameSession.create({
    data: { userId, totalRounds: triples.length },
  });

  await prisma.$transaction(
    triples.map((triple, index) =>
      prisma.round.create({
        data: {
          sessionId: session.id,
          frameId: triple.hard.id,
          secondFrameId: triple.medium.id,
          thirdFrameId: triple.easy.id,
          roundIndex: index,
          startedAt: index === 0 ? new Date() : new Date(0),
        },
      })
    )
  );

  // Only the hard frame is "seen" at session start — the medium/easy frames
  // are only marked seen once actually shown to the player (submitAnswer's
  // wrong-attempt branches), so unseen content isn't wasted on frames the
  // player never saw.
  const alreadySeen = new Set(
    (await prisma.userSeenFrame.findMany({ where: { userId }, select: { frameId: true } })).map(
      (s) => s.frameId
    )
  );
  const newlySeen = triples.map((t) => t.hard).filter((f) => !alreadySeen.has(f.id));
  // Per-row upserts (not createMany) so two concurrent startSession calls for
  // the same user (e.g. a double-tapped start button) don't race on a
  // read-then-bulk-insert and hit the (userId, frameId) unique constraint.
  await Promise.all(newlySeen.map((f) => markFrameSeen(prisma, userId, f.id)));

  const firstRound = await prisma.round.findFirst({
    where: { sessionId: session.id, roundIndex: 0 },
    include: { frame: true },
  });

  return {
    sessionId: session.id,
    totalRounds: session.totalRounds,
    roundIndex: 0,
    attemptsLeft: TOTAL_ATTEMPTS,
    timeLimitSeconds: ROUND_SECONDS,
    frame: frameDto(firstRound!.frame),
  };
}

async function finishRoundAndAdvance(
  prisma: PrismaClient,
  session: { id: number; userId: number; totalRounds: number; totalScore: number; correctCount: number },
  roundId: number,
  outcome: { isCorrect: boolean; answerText: string | null; score: number; streak: number }
) {
  await prisma.round.update({
    where: { id: roundId },
    data: {
      isCorrect: outcome.isCorrect,
      answerText: outcome.answerText,
      score: outcome.score,
      answeredAt: new Date(),
    },
  });

  const nextRoundIndex = (await prisma.gameSession.findUnique({ where: { id: session.id } }))!.currentRound + 1;
  const newTotalScore = Math.max(0, session.totalScore + outcome.score);
  const isSessionDone = nextRoundIndex >= session.totalRounds;

  await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      totalScore: newTotalScore,
      correctCount: outcome.isCorrect ? { increment: 1 } : undefined,
      currentStreak: outcome.streak,
      currentRound: nextRoundIndex,
      status: isSessionDone ? "finished" : "active",
      finishedAt: isSessionDone ? new Date() : null,
    },
  });

  if (isSessionDone) {
    const finalSession = await prisma.gameSession.findUnique({ where: { id: session.id } });
    await prisma.user.update({
      where: { id: session.userId },
      data: { totalScore: { increment: finalSession!.totalScore }, gamesPlayed: { increment: 1 } },
    });
    await upsertWeeklyScore(prisma, session.userId, finalSession!.totalScore);
    return {
      isSessionDone: true,
      nextFrame: null,
      sessionSummary: {
        totalScore: finalSession!.totalScore,
        correctCount: finalSession!.correctCount,
        totalRounds: finalSession!.totalRounds,
      },
    };
  }

  const upcoming = await prisma.round.findFirst({
    where: { sessionId: session.id, roundIndex: nextRoundIndex },
    include: { frame: true },
  });
  await prisma.round.update({ where: { id: upcoming!.id }, data: { startedAt: new Date() } });

  return { isSessionDone: false, nextFrame: frameDto(upcoming!.frame), roundIndex: nextRoundIndex };
}

function weekStartUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

async function upsertWeeklyScore(prisma: PrismaClient, userId: number, scoreDelta: number) {
  const weekStart = weekStartUTC(new Date());
  await prisma.weeklyScore.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    update: { score: { increment: scoreDelta } },
    create: { userId, weekStart, score: scoreDelta },
  });
}

export async function submitAnswer(
  prisma: PrismaClient,
  userId: number,
  sessionId: number,
  answerText: string,
  language = "uz"
) {
  const { session, round } = await loadActiveRound(prisma, sessionId);
  if (session.userId !== userId) throw new GameError("forbidden", 403);

  const hintsUsed = JSON.parse(round.hintsUsed) as HintType[];
  // round.startedAt marks the current attempt's clock. Giving up early (wrong
  // guess or skip, with time still on the clock) advances to the next
  // attempt on the *same* clock — no free time for skipping ahead. Only a
  // genuine expiry (the clock actually ran out) grants the next attempt a
  // fresh ROUND_SECONDS, since otherwise medium/easy would never be
  // reachable after a real timeout. A submission arriving after the grace
  // window is treated as "no answer" rather than matched against the text,
  // so a player can't stall then paste a correct guess.
  const elapsed = elapsedSeconds(round.startedAt);
  const timedOut = elapsed > ROUND_SECONDS + LATE_ANSWER_GRACE_SECONDS;
  const attemptTimeUp = elapsed >= ROUND_SECONDS;

  const attemptNumber = (round.attemptCount + 1) as 1 | 2 | 3;
  const aliases = filmAliases(round.frame.film);
  const match = timedOut ? { isCorrect: false } : matchAnswer(answerText, aliases);
  const activeFrame = frameInPlay(round, attemptNumber);
  const multiplier = DIFFICULTY_MULTIPLIER[activeFrame.difficulty] ?? 1;

  await prisma.round.update({
    where: { id: round.id },
    data: { attemptCount: attemptNumber, answerText: timedOut ? null : answerText },
  });

  if (match.isCorrect) {
    const newStreak = session.currentStreak + 1;
    const remainingSeconds = Math.max(0, ROUND_SECONDS - elapsed);
    const scoreResult = calculateRoundScore({
      isCorrect: true,
      attemptNumber,
      remainingSeconds,
      streakCount: newStreak,
      hintsUsed,
    });
    const total = Math.round(scoreResult.total * multiplier);

    const result = await finishRoundAndAdvance(prisma, session, round.id, {
      isCorrect: true,
      answerText,
      score: total,
      streak: newStreak,
    });

    return {
      isCorrect: true,
      score: total,
      breakdown: scoreResult,
      correctTitle: localizedTitle(round.frame.film, language),
      year: round.frame.film.year,
      posterUrl: round.frame.film.posterUrl,
      ...result,
    };
  }

  if (attemptNumber < 3 && attemptTimeUp) {
    await prisma.round.update({ where: { id: round.id }, data: { startedAt: new Date() } });
  }
  const remainingSeconds = Math.round(attemptTimeUp ? ROUND_SECONDS : Math.max(0, ROUND_SECONDS - elapsed));

  if (attemptNumber === 1) {
    if (round.secondFrame) {
      await markFrameSeen(prisma, userId, round.secondFrame.id);
      return {
        isCorrect: false,
        timedOut,
        attemptsLeft: 2,
        roundFinished: false,
        retryFrame: frameDto(round.secondFrame),
        remainingSeconds,
      };
    }
    return { isCorrect: false, timedOut, attemptsLeft: 2, roundFinished: false, remainingSeconds };
  }

  if (attemptNumber === 2) {
    if (round.thirdFrame) {
      await markFrameSeen(prisma, userId, round.thirdFrame.id);
      return {
        isCorrect: false,
        timedOut,
        attemptsLeft: 1,
        roundFinished: false,
        retryFrame: frameDto(round.thirdFrame),
        remainingSeconds,
      };
    }
    return { isCorrect: false, timedOut, attemptsLeft: 1, roundFinished: false, remainingSeconds };
  }

  const scoreResult = calculateRoundScore({
    isCorrect: false,
    attemptNumber,
    remainingSeconds: 0,
    streakCount: 0,
    hintsUsed,
  });

  const result = await finishRoundAndAdvance(prisma, session, round.id, {
    isCorrect: false,
    answerText: timedOut ? null : answerText,
    score: scoreResult.total,
    streak: 0,
  });

  return {
    isCorrect: false,
    timedOut,
    attemptsLeft: 0,
    score: scoreResult.total,
    correctTitle: localizedTitle(round.frame.film, language),
    year: round.frame.film.year,
    posterUrl: round.frame.film.posterUrl,
    ...result,
  };
}

const HINT_HANDLERS: Record<HintType, (film: { titleUz: string; titleRu: string; titleOriginal: string; year: number; genre: string }, language: string) => unknown> = {
  firstLetter: (film, language) => localizedTitle(film, language).trim().charAt(0).toUpperCase(),
  year: (film) => film.year,
  genre: (film) => film.genre,
  lettersCount: (film, language) =>
    localizedTitle(film, language)
      .split(" ")
      .map((word) => "_".repeat(word.length))
      .join(" "),
};

export async function useHint(
  prisma: PrismaClient,
  userId: number,
  sessionId: number,
  hintType: HintType,
  language: string
) {
  const { session, round } = await loadActiveRound(prisma, sessionId);
  if (session.userId !== userId) throw new GameError("forbidden", 403);

  const elapsed = elapsedSeconds(round.startedAt);
  if (elapsed > ROUND_SECONDS) throw new GameError("round_expired", 409);
  if (round.answeredAt) throw new GameError("round_already_answered", 409);

  const hintsUsed = JSON.parse(round.hintsUsed) as HintType[];
  if (hintsUsed.includes(hintType)) {
    throw new GameError("hint_already_used", 409);
  }

  hintsUsed.push(hintType);
  await prisma.round.update({ where: { id: round.id }, data: { hintsUsed: JSON.stringify(hintsUsed) } });

  const value = HINT_HANDLERS[hintType](round.frame.film, language);
  const costSoFar = hintsUsed.reduce((sum, h) => sum + HINT_COSTS[h], 0);

  return { hintType, value, cost: HINT_COSTS[hintType], costSoFar };
}

export async function getSessionState(prisma: PrismaClient, userId: number, sessionId: number) {
  const { session, round } = await loadActiveRound(prisma, sessionId);
  if (session.userId !== userId) throw new GameError("forbidden", 403);

  const elapsed = elapsedSeconds(round.startedAt);
  const remaining = Math.max(0, ROUND_SECONDS - elapsed);
  const activeFrame = frameInPlay(round, Math.min(round.attemptCount + 1, TOTAL_ATTEMPTS) as 1 | 2 | 3);

  return {
    sessionId: session.id,
    totalRounds: session.totalRounds,
    roundIndex: session.currentRound,
    totalScore: session.totalScore,
    correctCount: session.correctCount,
    attemptsLeft: TOTAL_ATTEMPTS - round.attemptCount,
    remainingSeconds: Math.round(remaining),
    frame: frameDto(activeFrame),
  };
}
