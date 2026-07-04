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
}
