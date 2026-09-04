import { z } from "zod";
import type { Branded } from "./brand";

/**
 * The key half of a structured ID (`greeting_550e8400-…` → the part after the separator).
 * A methodology names the key's shape once so every ID family that uses it agrees.
 */
export interface KeyMethodology<K extends string> {
  readonly name: string;
  /** An unanchored regex fragment; the toolbox anchors and composes it. */
  readonly pattern: string;
  /** Phantom, never assigned: it exists so a toolbox can infer `K` from its methodology. */
  readonly keyType?: K;
}

export type UuidKey = Branded<string, "UuidKey">;
export type NumberIndexKey = Branded<string, "NumberIndexKey">;
export type HashKey = Branded<string, "HashKey">;

const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const NUMBER_INDEX_PATTERN = "(?:0|[1-9][0-9]*)";

export const uuidKeyMethodology: KeyMethodology<UuidKey> = {
  name: "uuid",
  pattern: UUID_PATTERN,
};

export const numberIndexKeyMethodology: KeyMethodology<NumberIndexKey> = {
  name: "number-index",
  pattern: NUMBER_INDEX_PATTERN,
};

export function hashKeyMethodology(hashLength: number): KeyMethodology<HashKey> {
  if (!Number.isInteger(hashLength) || hashLength < 4) {
    throw new RangeError(`hashLength must be an integer >= 4, received ${hashLength}`);
  }
  return { name: `hash-${hashLength}`, pattern: `[0-9a-f]{${hashLength}}` };
}

function anchored(pattern: string): RegExp {
  return new RegExp(`^${pattern}$`, "u");
}

export const UuidKeySchema = z
  .string()
  .regex(anchored(UUID_PATTERN), "expected a v4 UUID")
  .transform((value) => value as UuidKey);

export const NumberIndexKeySchema = z
  .string()
  .regex(anchored(NUMBER_INDEX_PATTERN), "expected a non-negative integer with no leading zeros")
  .transform((value) => value as NumberIndexKey);

export function parseUuidKey(value: unknown): z.ZodSafeParseResult<UuidKey> {
  return UuidKeySchema.safeParse(value);
}

export function assertUuidKey(value: unknown): UuidKey {
  return UuidKeySchema.parse(value);
}

export function unsafeAsUuidKey(value: string): UuidKey {
  return value as UuidKey;
}

export function parseNumberIndexKey(value: unknown): z.ZodSafeParseResult<NumberIndexKey> {
  return NumberIndexKeySchema.safeParse(value);
}

export function assertNumberIndexKey(value: unknown): NumberIndexKey {
  return NumberIndexKeySchema.parse(value);
}

/**
 * Builds a key from a number the caller already holds. A non-integer or negative index is
 * a programming error, not bad input, so it throws.
 */
export function numberIndexKeyOf(index: number): NumberIndexKey {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(`index must be a non-negative integer, received ${index}`);
  }
  return String(index) as NumberIndexKey;
}

export function assertHashKey(value: unknown, hashLength: number): HashKey {
  return z
    .string()
    .regex(
      anchored(hashKeyMethodology(hashLength).pattern),
      `expected ${hashLength} lowercase hex characters`,
    )
    .transform((hash) => hash as HashKey)
    .parse(value);
}

export function unsafeAsHashKey(value: string): HashKey {
  return value as HashKey;
}
