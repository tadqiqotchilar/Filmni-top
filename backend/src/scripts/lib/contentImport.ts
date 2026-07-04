import type { PrismaClient } from "@prisma/client";
import { canonicalize } from "../../lib/matching.js";

type Difficulty = "easy" | "medium" | "hard";

export interface FilmManifestEntry {
  title_original: string;
  title_uz: string;
  title_ru: string;
  year: number;
  genre: string;
  poster_url?: string;
  aliases: string[];
  frames: { file: string; difficulty: Difficulty }[];
}

export interface ImportSummary {
  filmsCreated: number;
  filmsUpdated: number;
  framesCreated: number;
}

/** Replaces a film's aliases with the given list, canonicalized and deduplicated. */
export async function replaceAliases(
  prisma: PrismaClient,
  filmId: number,
  aliases: string[]
): Promise<string[]> {
  await prisma.filmAlias.deleteMany({ where: { filmId } });
  const uniqueAliases = [...new Set(aliases.map((a) => canonicalize(a)).filter(Boolean))];
  if (uniqueAliases.length > 0) {
    await prisma.filmAlias.createMany({
      data: uniqueAliases.map((alias) => ({ filmId, alias })),
    });
  }
  return uniqueAliases;
}

/** Shared upsert logic for both the production content importer and the demo seed script. */
export async function importFilms(
  prisma: PrismaClient,
  films: FilmManifestEntry[],
  imageUrlPrefix = "/content/images/"
): Promise<ImportSummary> {
  const summary: ImportSummary = { filmsCreated: 0, filmsUpdated: 0, framesCreated: 0 };

  for (const entry of films) {
    const existing = await prisma.film.findFirst({ where: { titleOriginal: entry.title_original } });

    const film = existing
      ? await prisma.film.update({
          where: { id: existing.id },
          data: {
            titleUz: entry.title_uz,
            titleRu: entry.title_ru,
            year: entry.year,
            genre: entry.genre,
            posterUrl: entry.poster_url,
          },
        })
      : await prisma.film.create({
          data: {
            titleOriginal: entry.title_original,
            titleUz: entry.title_uz,
            titleRu: entry.title_ru,
            year: entry.year,
            genre: entry.genre,
            posterUrl: entry.poster_url,
          },
        });

    if (existing) summary.filmsUpdated++;
    else summary.filmsCreated++;

    await replaceAliases(prisma, film.id, entry.aliases);

    for (const frame of entry.frames) {
      const imageUrl = `${imageUrlPrefix}${frame.file}`;
      const alreadyExists = await prisma.frame.findFirst({ where: { filmId: film.id, imageUrl } });
      if (alreadyExists) continue;

      await prisma.frame.create({
        data: { filmId: film.id, imageUrl, difficulty: frame.difficulty },
      });
      summary.framesCreated++;
    }
  }

  return summary;
}
