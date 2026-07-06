import { describe, it, expect } from "vitest";
import { buildStageChain, type EligibleFilm } from "../modules/game/stageService.js";

function film(id: number, stage: number): EligibleFilm {
  return {
    id,
    titleUz: `Film ${id}`,
    titleRu: `Film ${id}`,
    titleOriginal: `Film ${id}`,
    year: 2000,
    posterUrl: null,
    stage,
  };
}

describe("buildStageChain", () => {
  it("keeps stage 1 unlocked even with zero progress", () => {
    const films = [film(1, 1), film(2, 1)];
    const chain = buildStageChain(films, new Set());

    expect(chain[0].unlocked).toBe(true);
    expect(chain[0].complete).toBe(false);
  });

  it("auto-skips a stage number with 0 eligible films instead of blocking the chain", () => {
    // Stage 2 has no films at all (e.g. admin hasn't assigned any yet), but
    // stage 3 films exist — stage 3 should still be reachable once stage 1
    // is fully solved.
    const films = [film(1, 1), film(2, 3)];
    const chain = buildStageChain(films, new Set([1]));

    expect(chain).toHaveLength(3);
    expect(chain[0].complete).toBe(true); // stage 1 solved
    expect(chain[1].films).toHaveLength(0); // stage 2 empty
    expect(chain[1].complete).toBe(true); // auto-satisfied
    expect(chain[1].unlocked).toBe(true);
    expect(chain[2].unlocked).toBe(true); // stage 3 reachable through the gap
  });

  it("does not let an incomplete-content film block its stage (excluded upstream)", () => {
    // getEligibleStageFilms already filters out films missing a difficulty
    // before buildStageChain runs, so a stage with only the remaining
    // eligible films should be completable without the excluded film.
    const films = [film(1, 1)]; // film(2, 1) was excluded upstream as incomplete
    const chain = buildStageChain(films, new Set([1]));

    expect(chain[0].complete).toBe(true);
  });

  it("cascades unlocks correctly across 3+ stages", () => {
    const films = [film(1, 1), film(2, 2), film(3, 3)];

    const noProgress = buildStageChain(films, new Set());
    expect(noProgress[0].unlocked).toBe(true);
    expect(noProgress[1].unlocked).toBe(false);
    expect(noProgress[2].unlocked).toBe(false);

    const stage1Done = buildStageChain(films, new Set([1]));
    expect(stage1Done[1].unlocked).toBe(true);
    expect(stage1Done[2].unlocked).toBe(false);

    const stage1And2Done = buildStageChain(films, new Set([1, 2]));
    expect(stage1And2Done[2].unlocked).toBe(true);
  });
});
