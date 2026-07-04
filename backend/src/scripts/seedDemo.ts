// Local/dev convenience script: populates the DB with a small set of
// well-known films so the game is playable without a real content pipeline.
// Frame images are abstract placeholders (see placeholderFrame.ts) — swap
// them for real screenshots per TZ 7 before shipping.
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { importFilms, type FilmManifestEntry } from "./lib/contentImport.js";
import { generatePlaceholderSvg } from "./lib/placeholderFrame.js";

const prisma = new PrismaClient();

const DEMO_FILMS: FilmManifestEntry[] = [
  {
    title_original: "Titanic",
    title_uz: "Titanik",
    title_ru: "Титаник",
    year: 1997,
    genre: "drama",
    aliases: ["titanic", "titanik", "титаник"],
    frames: [
      { file: "titanic_01.svg", difficulty: "easy" },
      { file: "titanic_02.svg", difficulty: "medium" },
      { file: "titanic_03.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "The Shawshank Redemption",
    title_uz: "Shoushenkdan qochish",
    title_ru: "Побег из Шоушенка",
    year: 1994,
    genre: "drama",
    aliases: ["shawshank", "шоушенк", "shoushenkdan qochish", "shawshank redemption"],
    frames: [
      { file: "shawshank_01.svg", difficulty: "hard" },
      { file: "shawshank_02.svg", difficulty: "hard" },
      { file: "shawshank_03.svg", difficulty: "easy" },
    ],
  },
  {
    title_original: "The Lion King",
    title_uz: "Sher qirol",
    title_ru: "Король Лев",
    year: 1994,
    genre: "animation",
    aliases: ["lion king", "sher qirol", "король лев", "korol lev"],
    frames: [
      { file: "lionking_01.svg", difficulty: "easy" },
      { file: "lionking_02.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "Home Alone",
    title_uz: "Uydagi yolg'iz bola",
    title_ru: "Один дома",
    year: 1990,
    genre: "comedy",
    aliases: ["home alone", "uydagi yolgiz bola", "один дома", "odin doma"],
    frames: [
      { file: "homealone_01.svg", difficulty: "easy" },
      { file: "homealone_02.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "Avatar",
    title_uz: "Avatar",
    title_ru: "Аватар",
    year: 2009,
    genre: "sci-fi",
    aliases: ["avatar", "аватар"],
    frames: [
      { file: "avatar_01.svg", difficulty: "easy" },
      { file: "avatar_02.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "The Matrix",
    title_uz: "Matritsa",
    title_ru: "Матрица",
    year: 1999,
    genre: "sci-fi",
    aliases: ["matrix", "matritsa", "матрица"],
    frames: [
      { file: "matrix_01.svg", difficulty: "medium" },
      { file: "matrix_02.svg", difficulty: "easy" },
      { file: "matrix_03.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "Forrest Gump",
    title_uz: "Forrest Gamp",
    title_ru: "Форрест Гамп",
    year: 1994,
    genre: "drama",
    aliases: ["forrest gump", "forrest gamp", "форрест гамп"],
    frames: [
      { file: "forrestgump_01.svg", difficulty: "medium" },
      { file: "forrestgump_02.svg", difficulty: "easy" },
      { file: "forrestgump_03.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "Harry Potter and the Philosopher's Stone",
    title_uz: "Garri Potter va Falsafa toshi",
    title_ru: "Гарри Поттер и философский камень",
    year: 2001,
    genre: "fantasy",
    aliases: ["harry potter", "garri potter", "гарри поттер"],
    frames: [
      { file: "harrypotter_01.svg", difficulty: "easy" },
      { file: "harrypotter_02.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "Frozen",
    title_uz: "Muzlatilgan qalb",
    title_ru: "Холодное сердце",
    year: 2013,
    genre: "animation",
    aliases: ["frozen", "muzlatilgan qalb", "холодное сердце", "holodnoe serdce"],
    frames: [
      { file: "frozen_01.svg", difficulty: "easy" },
      { file: "frozen_02.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "Inception",
    title_uz: "Boshlanish",
    title_ru: "Начало",
    year: 2010,
    genre: "sci-fi",
    aliases: ["inception", "boshlanish", "начало", "nachalo"],
    frames: [
      { file: "inception_01.svg", difficulty: "medium" },
      { file: "inception_02.svg", difficulty: "easy" },
      { file: "inception_03.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "The Godfather",
    title_uz: "Cho'qintirilgan ota",
    title_ru: "Крёстный отец",
    year: 1972,
    genre: "crime",
    aliases: ["godfather", "chokintirilgan ota", "крестный отец", "krestniy otec"],
    frames: [
      { file: "godfather_01.svg", difficulty: "hard" },
      { file: "godfather_02.svg", difficulty: "easy" },
    ],
  },
  {
    title_original: "Interstellar",
    title_uz: "Yulduzlararo",
    title_ru: "Интерстеллар",
    year: 2014,
    genre: "sci-fi",
    aliases: ["interstellar", "yulduzlararo", "интерстеллар"],
    frames: [
      { file: "interstellar_01.svg", difficulty: "hard" },
      { file: "interstellar_02.svg", difficulty: "easy" },
    ],
  },
  {
    title_original: "Joker",
    title_uz: "Joker",
    title_ru: "Джокер",
    year: 2019,
    genre: "drama",
    aliases: ["joker", "джокер"],
    frames: [
      { file: "joker_01.svg", difficulty: "medium" },
      { file: "joker_02.svg", difficulty: "easy" },
      { file: "joker_03.svg", difficulty: "hard" },
    ],
  },
  {
    title_original: "Coco",
    title_uz: "Koko",
    title_ru: "Тайна Коко",
    year: 2017,
    genre: "animation",
    aliases: ["coco", "koko", "тайна коко", "taina koko"],
    frames: [
      { file: "coco_01.svg", difficulty: "medium" },
      { file: "coco_02.svg", difficulty: "easy" },
      { file: "coco_03.svg", difficulty: "hard" },
    ],
  },
];

async function main() {
  const imagesDir = path.join(process.cwd(), "content", "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  for (const film of DEMO_FILMS) {
    for (const frame of film.frames) {
      const filePath = path.join(imagesDir, frame.file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, generatePlaceholderSvg(film.title_original + frame.file, frame.difficulty));
      }
    }
  }

  const summary = await importFilms(prisma, DEMO_FILMS);
  console.log(
    `Demo seed complete: ${summary.filmsCreated} films created, ${summary.filmsUpdated} updated, ${summary.framesCreated} frames added.`
  );
  console.log("NOTE: frame images are abstract placeholders, not real film stills — see TZ 7.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
