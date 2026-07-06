-- AlterTable
ALTER TABLE "Film" ADD COLUMN "stage" INTEGER;

-- CreateTable
CREATE TABLE "UserFilmProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "filmId" INTEGER NOT NULL,
    "solvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFilmProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserFilmProgress_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserFilmProgress_filmId_idx" ON "UserFilmProgress"("filmId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFilmProgress_userId_filmId_key" ON "UserFilmProgress"("userId", "filmId");

-- CreateIndex
CREATE INDEX "Film_stage_idx" ON "Film"("stage");
