import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyTelegramInitData } from "./telegramAuth.js";
import { signToken } from "./jwt.js";
import { env } from "../../config/env.js";

const authBodySchema = z.object({
  initData: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/api/auth", async (request, reply) => {
    const parsed = authBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body" });
    }

    const { initData } = parsed.data;
    let telegramUser: { id: number; username?: string; first_name?: string; language_code?: string };

    if (env.AUTH_DEV_MODE && initData.startsWith("DEV:")) {
      telegramUser = JSON.parse(initData.slice(4));
    } else {
      const verified = verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
      if (!verified) {
        return reply.code(401).send({ error: "invalid_init_data" });
      }
      telegramUser = verified.user;
    }

    const telegramId = String(telegramUser.id);
    const language = telegramUser.language_code?.startsWith("ru") ? "ru" : "uz";

    const user = await fastify.prisma.user.upsert({
      where: { telegramId },
      update: {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
      },
      create: {
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        language,
      },
    });

    const token = signToken({ userId: user.id, telegramId: user.telegramId });

    return reply.send({
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        language: user.language,
        totalScore: user.totalScore,
        gamesPlayed: user.gamesPlayed,
      },
    });
  });
}
