// Runs on container boot (see Dockerfile CMD). Managed hosts like Railway
// don't offer easy one-off shell access to a deployed container's volume, so
// a fresh deploy's empty database is auto-populated with demo content here —
// but only once, so it never overwrites real content added later via the
// admin panel or import script.
import { PrismaClient } from "@prisma/client";
import { runDemoSeed } from "./seedDemo.js";

async function main() {
  const prisma = new PrismaClient();
  try {
    const filmCount = await prisma.film.count();
    if (filmCount > 0) {
      console.log(`Database already has ${filmCount} film(s), skipping demo seed.`);
      return;
    }
    await runDemoSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
