-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "frameId" INTEGER NOT NULL,
    "secondFrameId" INTEGER,
    "roundIndex" INTEGER NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" TEXT NOT NULL DEFAULT '[]',
    "answerText" TEXT,
    "isCorrect" BOOLEAN,
    "score" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" DATETIME,
    CONSTRAINT "Round_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Round_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Round_secondFrameId_fkey" FOREIGN KEY ("secondFrameId") REFERENCES "Frame" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Round" ("answerText", "answeredAt", "attemptCount", "frameId", "hintsUsed", "id", "isCorrect", "roundIndex", "score", "sessionId", "startedAt") SELECT "answerText", "answeredAt", "attemptCount", "frameId", "hintsUsed", "id", "isCorrect", "roundIndex", "score", "sessionId", "startedAt" FROM "Round";
DROP TABLE "Round";
ALTER TABLE "new_Round" RENAME TO "Round";
CREATE UNIQUE INDEX "Round_sessionId_roundIndex_key" ON "Round"("sessionId", "roundIndex");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
