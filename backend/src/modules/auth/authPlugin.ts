import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "./jwt.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    userId?: number;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return reply.code(401).send({ error: "missing_token" });
    }

    try {
      const payload = verifyToken(token);
      request.userId = payload.userId;
    } catch {
      return reply.code(401).send({ error: "invalid_token" });
    }
  });
});
