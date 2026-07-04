import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { constantTimeEqual } from "../../lib/adminAuth.js";
import { signAdminToken } from "./adminJwt.js";

const loginBodySchema = z.object({
  password: z.string().min(1),
});

export default async function adminAuthRoutes(fastify: FastifyInstance) {
  fastify.post("/api/admin/auth/login", async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body" });
    }

    if (!constantTimeEqual(parsed.data.password, env.ADMIN_PASSWORD)) {
      return reply.code(401).send({ error: "invalid_password" });
    }

    return reply.send({ token: signAdminToken() });
  });
}
