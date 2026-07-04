import type { FastifyInstance } from "fastify";

export default async function adminStatsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticateAdmin);

  fastify.get("/api/admin/stats", async (_request, reply) => {
    const [totalUsers, totalSessions, finishedSessions, totalFilms, totalFrames, topPlayers] =
      await Promise.all([
        fastify.prisma.user.count(),
        fastify.prisma.gameSession.count(),
        fastify.prisma.gameSession.count({ where: { status: "finished" } }),
        fastify.prisma.film.count(),
        fastify.prisma.frame.count(),
        fastify.prisma.user.findMany({
          orderBy: { totalScore: "desc" },
          take: 10,
          select: { id: true, username: true, firstName: true, totalScore: true, gamesPlayed: true },
        }),
      ]);

    return reply.send({
      totalUsers,
      totalSessions,
      finishedSessions,
      totalFilms,
      totalFrames,
      topPlayers,
    });
  });
}
