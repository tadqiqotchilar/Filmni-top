import { timingSafeEqual } from "node:crypto";

/** Constant-time string comparison so a slow string === doesn't leak the
 *  admin password's length/prefix via response timing. */
export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
