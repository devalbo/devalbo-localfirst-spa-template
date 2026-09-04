import { z } from "zod";
import type { Branded } from "./brand";
import {
  hashKeyMethodology,
  numberIndexKeyMethodology,
  uuidKeyMethodology,
  type HashKey,
  type KeyMethodology,
  type NumberIndexKey,
  type UuidKey,
} from "./keys";

/**
 * A structured ID: a domain prefix, a separator, and a key of a known methodology —
 * `greeting_550e8400-…`, `seat42`. The string is self-describing at runtime; the brand
 * makes it uncounterfeitable at compile time.
 */
export type PrefixKeyId<P extends string, K extends string> = Branded<
  string,
  ["PrefixKeyId", P, K]
>;

export interface PrefixKeyIdToolbox<P extends string, K extends string> {
  readonly prefix: P;
  readonly separator: string;
  readonly schema: z.ZodType<PrefixKeyId<P, K>, string>;
  /** The only way to mint an ID. Randomness, when needed, comes from the caller's key. */
  createIdForKey: (key: K) => PrefixKeyId<P, K>;
  /** The inverse of `createIdForKey`; total, because a valid ID always has a key. */
  keyOf: (id: PrefixKeyId<P, K>) => K;
  parseId: (value: unknown) => z.ZodSafeParseResult<PrefixKeyId<P, K>>;
  assertId: (value: unknown) => PrefixKeyId<P, K>;
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
}

export function createPrefixKeyIdToolbox<P extends string, K extends string>(
  prefix: P,
  methodology: KeyMethodology<K>,
  separator: string,
): PrefixKeyIdToolbox<P, K> {
  if (prefix.length === 0) {
    throw new RangeError("an ID prefix must not be empty");
  }

  const pattern = new RegExp(
    `^${escapeRegExp(prefix)}${escapeRegExp(separator)}${methodology.pattern}$`,
    "u",
  );
  const schema = z
    .string()
    .regex(pattern, `expected a ${prefix} id (${methodology.name} key)`)
    .transform((value) => value as PrefixKeyId<P, K>);

  const keyOffset = prefix.length + separator.length;

  return {
    prefix,
    separator,
    schema,
    createIdForKey: (key) => `${prefix}${separator}${key}` as PrefixKeyId<P, K>,
    keyOf: (id) => (id as string).slice(keyOffset) as K,
    parseId: (value) => schema.safeParse(value),
    assertId: (value) => schema.parse(value),
  };
}

/**
 * Underscore-separated by convention, because a UUID already contains hyphens and an
 * unseparated prefix would be unreadable.
 */
export function createUuidIdToolbox<P extends string>(
  prefix: P,
  separator = "_",
): PrefixKeyIdToolbox<P, UuidKey> {
  return createPrefixKeyIdToolbox(prefix, uuidKeyMethodology, separator);
}

/** Unseparated by convention (`seat42`), since a digit run is unambiguous after a word prefix. */
export function createNumberIndexIdToolbox<P extends string>(
  prefix: P,
  separator = "",
): PrefixKeyIdToolbox<P, NumberIndexKey> {
  return createPrefixKeyIdToolbox(prefix, numberIndexKeyMethodology, separator);
}

export function createHashIdToolbox<P extends string>(
  prefix: P,
  options: { readonly hashLength: number; readonly separator?: string },
): PrefixKeyIdToolbox<P, HashKey> {
  return createPrefixKeyIdToolbox(
    prefix,
    hashKeyMethodology(options.hashLength),
    options.separator ?? "_",
  );
}
