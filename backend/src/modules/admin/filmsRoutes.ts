import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { replaceAliases } from "../../scripts/lib/contentImport.js";

const createFilmSchema = z.object({
  titleOriginal: z.string().min(1),
  titleUz: z.string().min(1),
  titleRu: z.string().min(1),
  year: z.coerce.number().int(),
  genre: z.string().min(1),
  posterUrl: z.string().min(1).optional(),
  stage: z.coerce.number().int().positive().nullable().optional(),
  aliases: z.array(z.string()).default([]),
});

const updateFilmSchema = z.object({
  titleOriginal: z.string().min(1).optional(),
  titleUz: z.string().min(1).optional(),
  titleRu: z.string().min(1).optional(),
  year: z.coerce.number().int().optional(),
  genre: z.string().min(1).optional(),
  posterUrl: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  stage: z.coerce.number().int().positive().nullable().optional(),
  aliases: z.array(z.string()).optional(),
});

function serializeFilm(film: {
  id: number;
  titleOriginal: string;
  titleUz: string;
  titleRu: string;
  year: number;
  genre: string;
  posterUrl: string | null;
  isActive: boolean;
  stage: number | null;
  aliases: { alias: string }[];
  frames?: unknown[];
  _count?: { frames: number };
}) {
  return {
    id: film.id,
    titleOriginal: film.titleOriginal,
    titleUz: film.titleUz,
    titleRu: film.titleRu,
    year: film.year,
    genre: film.genre,
    posterUrl: film.posterUrl,
    isActive: film.isActive,
    stage: film.stage,
    aliases: film.aliases.map((a) => a.alias),
    frameCount: film._count?.frames ?? film.frames?.length ?? undefined,
    frames: film.frames,
  };
}

export default async function adminFilmsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticateAdmin);

  fastify.get("/api/admin/films", async (_request, reply) => {
    const films = await fastify.prisma.film.findMany({
      orderBy: { id: "desc" },
      include: { aliases: true, _count: { select: { frames: true } } },
    });
    return reply.send({ films: films.map(serializeFilm) });
  });

  fastify.get<{ Params: { id: string } }>("/api/admin/films/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "invalid_id" });

    const film = await fastify.prisma.film.findUnique({
      where: { id },
      include: { aliases: true, frames: { orderBy: { id: "asc" } } },
    });
    if (!film) return reply.code(404).send({ error: "film_not_found" });

    return reply.send({ film: serializeFilm(film) });
  });

  fastify.post("/api/admin/films", async (request, reply) => {
    const parsed = createFilmSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { aliases, ...data } = parsed.data;
    const film = await fastify.prisma.film.create({ data });
    await replaceAliases(fastify.prisma, film.id, aliases);

    const withAliases = await fastify.prisma.film.findUniqueOrThrow({
      where: { id: film.id },
      include: { aliases: true },
    });
    return reply.code(201).send({ film: serializeFilm(withAliases) });
  });

  fastify.patch<{ Params: { id: string } }>("/api/admin/films/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "invalid_id" });

    const parsed = updateFilmSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { aliases, ...data } = parsed.data;

    const existing = await fastify.prisma.film.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "film_not_found" });

    const film = await fastify.prisma.film.update({ where: { id }, data });
    if (aliases) await replaceAliases(fastify.prisma, film.id, aliases);

    const withAliases = await fastify.prisma.film.findUniqueOrThrow({
      where: { id: film.id },
      include: { aliases: true },
    });
    return reply.send({ film: serializeFilm(withAliases) });
  });

  fastify.delete<{ Params: { id: string } }>("/api/admin/films/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "invalid_id" });

    const existing = await fastify.prisma.film.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "film_not_found" });

    // Frame and Round rows referencing this film cascade away with it (see
    // the Round.frame*/Frame.film relations), so this always fully removes
    // the film instead of falling back to a soft delete.
    await fastify.prisma.film.delete({ where: { id } });
    return reply.code(204).send();
  });
}
