// Generates an abstract, title-free placeholder image so the demo seed has
// something to render. Real content must replace these with actual film
// stills per TZ 7.1 (no watermarks/subtitles revealing the title).
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function hslFromHash(hash: number, offset: number): string {
  const hue = (hash + offset) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "OSON",
  medium: "O'RTA",
  hard: "QIYIN",
};

export function generatePlaceholderSvg(seed: string, difficulty: string): string {
  const hash = hashSeed(seed);
  const colorA = hslFromHash(hash, 0);
  const colorB = hslFromHash(hash, 120);
  const cx = 200 + (hash % 880);
  const cy = 150 + ((hash >> 4) % 420);
  const r = 80 + (hash % 160);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.12)"/>
  <circle cx="${1280 - cx}" cy="${720 - cy}" r="${r * 0.6}" fill="rgba(0,0,0,0.12)"/>
  <text x="1240" y="700" text-anchor="end" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.55)">${DIFFICULTY_LABEL[difficulty] ?? ""}</text>
</svg>`;
}
