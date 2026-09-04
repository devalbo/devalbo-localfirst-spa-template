import { z } from "zod";
import type { Branded } from "./brand";

/**
 * Numeric brands exist to stop silent unit confusion — milliseconds passed where seconds
 * were meant compiles fine and is wrong by three orders of magnitude.
 *
 * Arithmetic strips the brand (`Milliseconds + Milliseconds` is `number`), which is
 * deliberate: re-apply it at the point you decide the result still carries the unit.
 */
export type BrandedNumber<B extends string> = Branded<number, ["BrandedNumber", B]>;

/** Zod 4's `z.number()` already rejects `Infinity` and `NaN`, so finiteness needs no refinement. */
export function createBrandedFiniteSchema<B extends string>(
  brand: B,
): z.ZodType<BrandedNumber<B>, number> {
  return z
    .number(`${brand} must be a finite number`)
    .transform((value) => value as BrandedNumber<B>);
}

export function createBrandedIntSchema<B extends string>(
  brand: B,
): z.ZodType<BrandedNumber<B>, number> {
  return z
    .number()
    .int(`${brand} must be an integer`)
    .transform((value) => value as BrandedNumber<B>);
}

export function createBrandedNonNegativeIntSchema<B extends string>(
  brand: B,
): z.ZodType<BrandedNumber<B>, number> {
  return z
    .number()
    .int(`${brand} must be an integer`)
    .nonnegative(`${brand} must not be negative`)
    .transform((value) => value as BrandedNumber<B>);
}

export function createBrandedPositiveIntSchema<B extends string>(
  brand: B,
): z.ZodType<BrandedNumber<B>, number> {
  return z
    .number()
    .int(`${brand} must be an integer`)
    .positive(`${brand} must be positive`)
    .transform((value) => value as BrandedNumber<B>);
}

/** Trusted-source cast. Use a schema's `parse`/`safeParse` for anything untrusted. */
export function unsafeAsBrandedNumber<B extends string>(value: number): BrandedNumber<B> {
  return value as BrandedNumber<B>;
}
