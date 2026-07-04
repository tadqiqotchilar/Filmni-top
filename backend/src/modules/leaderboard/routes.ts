import type { FastifyInstance } from "fastify";
import { z } from "zod";

function weekStartUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/leaderboard", async (request, reply) => {
    const querySchema = z.object({ period: z.enum(["weekly", "all"]).default("all") });
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_query" });

    const userId = request.userId!;

    if (parsed.data.period === "all") {
      const top = await fastify.prisma.user.findMany({
        orderBy: { totalScore: "desc" },
        take: 100,
        select: { id: true, username: true, firstName: true, avatarUrl: true, totalScore: true },
      });

      const myRank = await getAllTimeRank(fastify, userId);
      return reply.send({ period: "all", entries: withRank(top), me: myRank });
    }

    const weekStart = weekStartUTC(new Date());
    const scores = await fastify.prisma.weeklyScore.findMany({
      where: { weekStart },
      orderBy: { score: "desc" },
      take: 100,
      include: { user: { select: { id: true, username: true, firstName: true, avatarUrl: true } } },
    });

    const entries = scores.map((s, i) => ({
      rank: i + 1,
      id: s.user.id,
      username: s.user.username,
      firstName: s.user.firstName,
      avatarUrl: s.user.avatarUrl,
      score: s.score,
    }));

    const mine = scores.find((s) => s.userId === userId);
    const me = mine
      ? { rank: entries.findIndex((e) => e.id === userId) + 1, score: mine.score }
      : null;

    return reply.send({ period: "weekly", entries, me });
  });
}

function withRank(users: { id: number; username: string | null; firstName: string | null; avatarUrl: string | null; totalScore: number }[]) {
  return users.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    username: u.username,
    firstName: u.firstName,
    avatarUrl: u.avatarUrl,
    score: u.totalScore,
  }));
}

async function getAllTimeRank(fastify: FastifyInstance, userId: number) {
  const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const higherCount = await fastify.prisma.user.count({ where: { totalScore: { gt: user.totalScore } } });
  return { rank: higherCount + 1, score: user.totalScore };
}
