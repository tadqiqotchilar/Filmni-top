// Production content pipeline (TZ 7.2): reads a JSON manifest of films/frames
// and upserts them into the database. Image files referenced by "file" must
// already exist under backend/content/images/.
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { importFilms, type FilmManifestEntry } from "./lib/contentImport.js";

const prisma = new PrismaClient();

async function main() {
  const manifestPath = process.argv[2] ?? path.join(process.cwd(), "content", "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    console.error("Pass a path: npm run seed --workspace=backend -- content/manifest.json");
    process.exit(1);
  }

  const films = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as FilmManifestEntry[];

  const imagesDir = path.join(process.cwd(), "content", "images");
  const missing: string[] = [];
  for (const film of films) {
    for (const frame of film.frames) {
      if (!fs.existsSync(path.join(imagesDir, frame.file))) missing.push(frame.file);
    }
  }
  if (missing.length > 0) {
    console.warn(`Warning: ${missing.length} referenced image file(s) not found in content/images/:`);
    for (const file of missing) console.warn(`  - ${file}`);
  }

  const summary = await importFilms(prisma, films);
  console.log(
    `Import complete: ${summary.filmsCreated} films created, ${summary.filmsUpdated} updated, ${summary.framesCreated} frames added.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
