import { describe, it, expect } from "vitest";
import {
  normalizeText,
  transliterate,
  canonicalize,
  levenshteinDistance,
  getMaxAllowedDistance,
  matchAnswer,
} from "../lib/matching.js";

describe("normalizeText", () => {
  it("lowercases, strips punctuation and apostrophes, collapses spaces", () => {
    expect(normalizeText("  The Shawshank Redemption!!  ")).toBe("the shawshank redemption");
    expect(normalizeText("O'zbekcha nom")).toBe("ozbekcha nom");
    expect(normalizeText("Qo‘shni")).toBe("qoshni");
  });
});

describe("transliterate", () => {
  it("converts Russian Cyrillic to Latin", () => {
    expect(transliterate("титаник")).toBe("titanik");
  });

  it("leaves Latin text untouched", () => {
    expect(transliterate("titanic")).toBe("titanic");
  });

  it("handles Uzbek Cyrillic extras", () => {
    expect(transliterate("шоушенк")).toBe("shoushenk");
  });
});

describe("canonicalize", () => {
  it("makes Cyrillic and Latin spellings of the same title equal", () => {
    expect(canonicalize("Титаник")).toBe(canonicalize("Titanik"));
  });

  it("matches the TZ example: Титаник = Titanik", () => {
    expect(canonicalize("Титаник")).toBe("titanik");
    expect(canonicalize("Titanik")).toBe("titanik");
  });
});

describe("levenshteinDistance", () => {
  it("is 0 for identical strings", () => {
    expect(levenshteinDistance("titanic", "titanic")).toBe(0);
  });

  it("counts single-character typos", () => {
    expect(levenshteinDistance("titanic", "titanik")).toBe(1);
    expect(levenshteinDistance("titanic", "titanc")).toBe(1);
  });

  it("handles empty strings", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
  });
});

describe("getMaxAllowedDistance", () => {
  it("allows 1 typo for <=5 char words", () => {
    expect(getMaxAllowedDistance(3)).toBe(1);
    expect(getMaxAllowedDistance(5)).toBe(1);
  });

  it("allows 2 typos for 6-10 char words", () => {
    expect(getMaxAllowedDistance(6)).toBe(2);
    expect(getMaxAllowedDistance(10)).toBe(2);
  });

  it("allows 3 typos for words longer than 10 chars", () => {
    expect(getMaxAllowedDistance(11)).toBe(3);
    expect(getMaxAllowedDistance(30)).toBe(3);
  });
});

describe("matchAnswer", () => {
  const aliases = [
    "The Shawshank Redemption",
    "Побег из Шоушенка",
    "Shoushenkdan qochish",
    "Shawshank",
    "Шоушенк",
  ];

  it("accepts an exact alias match", () => {
    const result = matchAnswer("shawshank", aliases);
    expect(result.isCorrect).toBe(true);
  });

  it("accepts the Cyrillic alias written in Cyrillic", () => {
    const result = matchAnswer("Шоушенк", aliases);
    expect(result.isCorrect).toBe(true);
  });

  it("accepts a Latin transliteration of a Cyrillic alias", () => {
    const result = matchAnswer("Shoushenk", aliases);
    expect(result.isCorrect).toBe(true);
  });

  it("tolerates a single typo on a short alias", () => {
    const result = matchAnswer("Shawshenk", aliases); // 1 letter off from "Shawshank"
    expect(result.isCorrect).toBe(true);
  });

  it("rejects an unrelated word", () => {
    const result = matchAnswer("Titanic", aliases);
    expect(result.isCorrect).toBe(false);
  });

  it("rejects an empty answer", () => {
    const result = matchAnswer("   ", aliases);
    expect(result.isCorrect).toBe(false);
  });

  it("rejects too many typos on a long title", () => {
    // "The Shawshank Redemption" canonicalized has >10 chars, allows 3 typos
    const result = matchAnswer("Da Shewshenk Redemzion Extra", aliases);
    expect(result.isCorrect).toBe(false);
  });
});
