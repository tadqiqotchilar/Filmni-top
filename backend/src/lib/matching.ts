// Answer-checking engine: TZ 3.3 — normalize, translit, alias match, fuzzy match.

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "s",
  ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu",
  я: "ya",
  // Uzbek-Cyrillic extras
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/** Lowercase, strip punctuation/apostrophes, collapse whitespace. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/['`´‘’ʻʼ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map Cyrillic letters to their Latin transliteration; Latin input passes through untouched. */
export function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  return out;
}

/** Full canonical form used for comparison: normalize -> transliterate -> normalize. */
export function canonicalize(input: string): string {
  return normalizeText(transliterate(normalizeText(input)));
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** TZ 3.3.3: allowed typo count scales with the reference word's length. */
export function getMaxAllowedDistance(referenceLength: number): number {
  if (referenceLength <= 5) return 1;
  if (referenceLength <= 10) return 2;
  return 3;
}

export interface MatchResult {
  isCorrect: boolean;
  matchedAlias: string | null;
  distance: number | null;
}

/**
 * Compares a user's raw answer against a film's accepted aliases.
 * Aliases may be stored already-canonicalized or as raw display strings —
 * both are re-canonicalized here so callers don't need to pre-process.
 */
export function matchAnswer(userInput: string, aliases: string[]): MatchResult {
  const candidate = canonicalize(userInput);
  if (!candidate) return { isCorrect: false, matchedAlias: null, distance: null };

  let best: MatchResult = { isCorrect: false, matchedAlias: null, distance: null };

  for (const rawAlias of aliases) {
    const alias = canonicalize(rawAlias);
    if (!alias) continue;

    const distance = levenshteinDistance(candidate, alias);
    const allowed = getMaxAllowedDistance(alias.length);
    const isMatch = distance <= allowed;

    if (best.distance === null || distance < best.distance) {
      best = { isCorrect: isMatch, matchedAlias: rawAlias, distance };
    }
    if (distance === 0) break; // exact match, no need to keep scanning
  }

  return best;
}
