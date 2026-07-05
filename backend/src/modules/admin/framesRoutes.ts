import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const difficultySchema = z.enum(["easy", "medium", "hard"]);

const updateFrameSchema = z.object({
  difficulty: difficultySchema.optional(),
  isActive: z.boolean().optional(),
});

function imagesDir(): string {
  return path.join(process.cwd(), "content", "images");
}

export default async function adminFramesRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticateAdmin);

  fastify.get<{ Params: { filmId: string } }>(
    "/api/admin/films/:filmId/frames",
    async (request, reply) => {
      const filmId = Number(request.params.filmId);
      if (!Number.isInteger(filmId)) return reply.code(400).send({ error: "invalid_id" });

      const frames = await fastify.prisma.frame.findMany({
        where: { filmId },
        orderBy: { id: "asc" },
      });
      return reply.send({ frames });
    }
  );

  fastify.post<{ Params: { filmId: string } }>(
    "/api/admin/films/:filmId/frames",
    async (request, reply) => {
      const filmId = Number(request.params.filmId);
      if (!Number.isInteger(filmId)) return reply.code(400).send({ error: "invalid_id" });

      const film = await fastify.prisma.film.findUnique({ where: { id: filmId } });
      if (!film) return reply.code(404).send({ error: "film_not_found" });

      const data = await request.file();
      if (!data) return reply.code(400).send({ error: "missing_file" });

      // Non-file fields are only parsed once the file stream has been drained
      // (busboy parses the multipart body as a stream, and "image" is sent
      // before "difficulty"), so the buffer must be read before any field
      // access below — otherwise the request hangs forever on an early
      // return, since the file stream is never consumed.
      const buffer = await data.toBuffer();
      if (data.file.truncated) {
        return reply.code(413).send({ error: "file_too_large" });
      }

      const difficultyRaw = data.fields.difficulty;
      const difficultyValue =
        difficultyRaw && "value" in difficultyRaw ? String(difficultyRaw.value) : undefined;
      const parsedDifficulty = difficultySchema.safeParse(difficultyValue);
      if (!parsedDifficulty.success) {
        return reply.code(400).send({ error: "invalid_difficulty" });
      }

      const ext = path.extname(data.filename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext) || !data.mimetype.startsWith("image/")) {
        return reply.code(400).send({ error: "unsupported_file_type" });
      }

      const filename = `${randomUUID()}${ext}`;
      await fs.mkdir(imagesDir(), { recursive: true });
      await fs.writeFile(path.join(imagesDir(), filename), buffer);

      const frame = await fastify.prisma.frame.create({
        data: {
          filmId,
          imageUrl: `/content/images/${filename}`,
          difficulty: parsedDifficulty.data,
        },
      });

      return reply.code(201).send({ frame });
    }
  );

  fastify.patch<{ Params: { id: string } }>("/api/admin/frames/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "invalid_id" });

    const parsed = updateFrameSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const existing = await fastify.prisma.frame.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "frame_not_found" });

    const frame = await fastify.prisma.frame.update({ where: { id }, data: parsed.data });
    return reply.send({ frame });
  });

  fastify.delete<{ Params: { id: string } }>("/api/admin/frames/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "invalid_id" });

    const existing = await fastify.prisma.frame.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "frame_not_found" });

    // Round rows referencing this frame cascade away with it, so this always
    // fully removes the frame instead of falling back to a soft delete.
    await fastify.prisma.frame.delete({ where: { id } });
    return reply.code(204).send();
  });
}
