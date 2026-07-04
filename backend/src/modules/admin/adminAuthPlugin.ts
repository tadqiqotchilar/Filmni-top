import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyAdminToken } from "./adminJwt.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("authenticateAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return reply.code(401).send({ error: "missing_token" });
    }

    try {
      verifyAdminToken(token);
    } catch {
      return reply.code(401).send({ error: "invalid_token" });
    }
  });
});
