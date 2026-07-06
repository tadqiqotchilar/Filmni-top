import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { GameError, startFilmRound, submitAnswer, useHint, getSessionState } from "./gameService.js";
import { getStagesOverview } from "./stageService.js";
import { HINT_COSTS } from "../../lib/scoring.js";

const hintTypeSchema = z.enum(Object.keys(HINT_COSTS) as [keyof typeof HINT_COSTS]);

function handleGameError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof GameError) {
    return reply.code(error.statusCode).send({ error: error.code });
  }
  throw error;
}

export default async function gameRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post("/api/game/start", async (request, reply) => {
    const bodySchema = z.object({ filmId: z.number().int() });
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      const result = await startFilmRound(fastify.prisma, request.userId!, parsed.data.filmId);
      return reply.send(result);
    } catch (error) {
      return handleGameError(error, reply);
    }
  });

  fastify.get("/api/stages", async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({ where: { id: request.userId! } });
    const result = await getStagesOverview(fastify.prisma, request.userId!, user?.language ?? "uz");
    return reply.send(result);
  });

  fastify.post("/api/game/answer", async (request, reply) => {
    const bodySchema = z.object({ sessionId: z.number().int(), answerText: z.string().max(200) });
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      const user = await fastify.prisma.user.findUnique({ where: { id: request.userId! } });
      const result = await submitAnswer(
        fastify.prisma,
        request.userId!,
        parsed.data.sessionId,
        parsed.data.answerText,
        user?.language ?? "uz"
      );
      return reply.send(result);
    } catch (error) {
      return handleGameError(error, reply);
    }
  });

  fastify.post("/api/game/hint", async (request, reply) => {
    const bodySchema = z.object({ sessionId: z.number().int(), hintType: hintTypeSchema });
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      const user = await fastify.prisma.user.findUnique({ where: { id: request.userId! } });
      const result = await useHint(
        fastify.prisma,
        request.userId!,
        parsed.data.sessionId,
        parsed.data.hintType,
        user?.language ?? "uz"
      );
      return reply.send(result);
    } catch (error) {
      return handleGameError(error, reply);
    }
  });

  fastify.get("/api/game/session/:id", async (request, reply) => {
    const paramsSchema = z.object({ id: z.coerce.number().int() });
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    try {
      const result = await getSessionState(fastify.prisma, request.userId!, parsed.data.id);
      return reply.send(result);
    } catch (error) {
      return handleGameError(error, reply);
    }
  });
}
