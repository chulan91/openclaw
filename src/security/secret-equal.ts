import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Timing-safe secret comparison.
 *
 * Both inputs are SHA-256-hashed so the comparison is always fixed-length
 * (32 bytes) regardless of the original secret length.  Non-string inputs
 * are normalised to a sentinel before hashing so the code path and timing
 * remain constant — an early return that leaks whether a value is a string
 * vs. null/undefined is intentionally avoided.
 */
export function safeEqualSecret(
  provided: string | undefined | null,
  expected: string | undefined | null,
): boolean {
  // Use a sentinel value that cannot collide with real secrets to avoid
  // early-return timing side-channels when either input is not a string.
  const sentinel = "\x00__not_a_string__\x00";
  const providedStr = typeof provided === "string" ? provided : sentinel;
  const expectedStr = typeof expected === "string" ? expected : sentinel;

  const hash = (s: string) => createHash("sha256").update(s).digest();
  const hashesEqual = timingSafeEqual(hash(providedStr), hash(expectedStr));

  // Both values must be real strings *and* their hashes must match.
  // The boolean ANDs below are constant-time at the JS level because all
  // operands have already been computed.
  return typeof provided === "string" && typeof expected === "string" && hashesEqual;
}
