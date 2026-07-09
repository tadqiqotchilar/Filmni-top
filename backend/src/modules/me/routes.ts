import type { FastifyInstance } from "fastify";
import { z } from "zod";

export default async function meRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/me", async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({ where: { id: request.userId! } });
    if (!user) return reply.code(404).send({ error: "user_not_found" });

    return reply.send({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      avatarUrl: user.avatarUrl,
      language: user.language,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
    });
  });

  fastify.patch("/api/me/settings", async (request, reply) => {
    const bodySchema = z.object({ language: z.enum(["uz", "ru"]).optional() });
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const user = await fastify.prisma.user.update({
      where: { id: request.userId! },
      data: { language: parsed.data.language },
    });

    return reply.send({ id: user.id, language: user.language });
  });

  // Wipes this user's own score, stage progress and game history back to a
  // fresh-account state. Sessions/rounds cascade-delete with the user's
  // GameSession rows (see schema.prisma), so those don't need a separate call.
  fastify.post("/api/me/reset", async (request, reply) => {
    const userId = request.userId!;

    const user = await fastify.prisma.$transaction(async (tx) => {
      await tx.gameSession.deleteMany({ where: { userId } });
      await tx.userFilmProgress.deleteMany({ where: { userId } });
      await tx.userSeenFrame.deleteMany({ where: { userId } });
      await tx.weeklyScore.deleteMany({ where: { userId } });
      return tx.user.update({ where: { id: userId }, data: { totalScore: 0, gamesPlayed: 0 } });
    });

    return reply.send({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      avatarUrl: user.avatarUrl,
      language: user.language,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
    });
  });
}
