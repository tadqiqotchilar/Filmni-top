import type { FastifyInstance } from "fastify";

export default async function adminSettingsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticateAdmin);

  // Wipes every user's score, stage progress and game history back to a
  // fresh-account state. Sessions/rounds cascade-delete with GameSession
  // rows (see schema.prisma), so those don't need a separate deleteMany.
  fastify.post("/api/admin/reset-all", async (_request, reply) => {
    const result = await fastify.prisma.$transaction(async (tx) => {
      const sessions = await tx.gameSession.deleteMany({});
      const progress = await tx.userFilmProgress.deleteMany({});
      const seenFrames = await tx.userSeenFrame.deleteMany({});
      const weeklyScores = await tx.weeklyScore.deleteMany({});
      const users = await tx.user.updateMany({ data: { totalScore: 0, gamesPlayed: 0 } });

      return {
        usersReset: users.count,
        sessionsDeleted: sessions.count,
        progressDeleted: progress.count,
        seenFramesDeleted: seenFrames.count,
        weeklyScoresDeleted: weeklyScores.count,
      };
    });

    return reply.send(result);
  });
}
