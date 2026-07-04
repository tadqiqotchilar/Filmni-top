import { describe, it, expect } from "vitest";
import {
  calculateHintsCost,
  calculateSpeedBonus,
  calculateStreakBonus,
  calculateRoundScore,
} from "../lib/scoring.js";

describe("calculateHintsCost", () => {
  it("sums costs of each hint used", () => {
    expect(calculateHintsCost([])).toBe(0);
    expect(calculateHintsCost(["firstLetter"])).toBe(10);
    expect(calculateHintsCost(["firstLetter", "year", "genre", "lettersCount"])).toBe(40);
  });
});

describe("calculateSpeedBonus", () => {
  it("gives +1 per remaining second", () => {
    expect(calculateSpeedBonus(10)).toBe(10);
  });

  it("caps at 55", () => {
    expect(calculateSpeedBonus(60)).toBe(55);
  });

  it("floors at 0 for negative/expired timers", () => {
    expect(calculateSpeedBonus(-5)).toBe(0);
  });
});

describe("calculateStreakBonus", () => {
  it("gives no bonus below the streak threshold", () => {
    expect(calculateStreakBonus(1)).toBe(0);
    expect(calculateStreakBonus(2)).toBe(0);
  });

  it("gives +20 at the 3-streak threshold", () => {
    expect(calculateStreakBonus(3)).toBe(20);
  });

  it("adds +10 per additional streak beyond the threshold", () => {
    expect(calculateStreakBonus(4)).toBe(30);
    expect(calculateStreakBonus(5)).toBe(40);
  });
});

describe("calculateRoundScore", () => {
  it("awards base + speed + streak on a first-attempt correct answer", () => {
    const result = calculateRoundScore({
      isCorrect: true,
      attemptNumber: 1,
      remainingSeconds: 30,
      streakCount: 3,
      hintsUsed: [],
    });
    expect(result).toEqual({
      baseScore: 100,
      speedBonus: 30,
      streakBonus: 20,
      hintsCost: 0,
      total: 150,
    });
  });

  it("uses the reduced base score on the second attempt", () => {
    const result = calculateRoundScore({
      isCorrect: true,
      attemptNumber: 2,
      remainingSeconds: 0,
      streakCount: 1,
      hintsUsed: [],
    });
    expect(result.baseScore).toBe(50);
    expect(result.total).toBe(50);
  });

  it("deducts hint costs from a correct answer", () => {
    const result = calculateRoundScore({
      isCorrect: true,
      attemptNumber: 1,
      remainingSeconds: 0,
      streakCount: 1,
      hintsUsed: ["firstLetter", "genre"],
    });
    expect(result.hintsCost).toBe(20);
    expect(result.total).toBe(80); // 100 - 20
  });

  it("scores 0 (minus any spent hints) on a wrong answer", () => {
    const result = calculateRoundScore({
      isCorrect: false,
      attemptNumber: 2,
      remainingSeconds: 0,
      streakCount: 0,
      hintsUsed: ["year"],
    });
    expect(result.total).toBe(-15);
    expect(result.baseScore).toBe(0);
  });
});
