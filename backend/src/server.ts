import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import staticPlugin from "@fastify/static";
import multipart from "@fastify/multipart";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./modules/auth/authPlugin.js";
import authRoutes from "./modules/auth/routes.js";
import gameRoutes from "./modules/game/routes.js";
import leaderboardRoutes from "./modules/leaderboard/routes.js";
import meRoutes from "./modules/me/routes.js";
import adminAuthPlugin from "./modules/admin/adminAuthPlugin.js";
import adminAuthRoutes from "./modules/admin/authRoutes.js";
import adminFilmsRoutes from "./modules/admin/filmsRoutes.js";
import adminFramesRoutes from "./modules/admin/framesRoutes.js";
import adminStatsRoutes from "./modules/admin/statsRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  });

  // TZ 6.3: max 5 requests/second per user (keyed by IP; JWT-derived key
  // would be better behind a proxy that forwards a stable client IP).
  await fastify.register(rateLimit, { max: 5, timeWindow: "1 second" });

  await fastify.register(staticPlugin, {
    root: path.join(__dirname, "..", "content", "images"),
    prefix: "/content/images/",
  });

  await fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);
  await fastify.register(adminAuthPlugin);

  await fastify.register(authRoutes);
  await fastify.register(gameRoutes);
  await fastify.register(leaderboardRoutes);
  await fastify.register(meRoutes);

  await fastify.register(adminAuthRoutes);
  await fastify.register(adminFilmsRoutes);
  await fastify.register(adminFramesRoutes);
  await fastify.register(adminStatsRoutes);

  fastify.get("/health", async () => ({ ok: true }));

  await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
