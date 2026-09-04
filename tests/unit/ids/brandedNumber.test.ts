import { describe, expect, it } from "vitest";
import {
  createBrandedFiniteSchema,
  createBrandedIntSchema,
  createBrandedNonNegativeIntSchema,
  createBrandedPositiveIntSchema,
  unsafeAsBrandedNumber,
  type BrandedNumber,
} from "@/ids/brandedNumber";

type Milliseconds = BrandedNumber<"Milliseconds">;
type Seconds = BrandedNumber<"Seconds">;

const MillisecondsSchema = createBrandedNonNegativeIntSchema("Milliseconds");

function secondsToMillis(value: Seconds): Milliseconds {
  return unsafeAsBrandedNumber(value * 1000);
}

const takesMillis = (value: Milliseconds): number => value;

describe("branded number schemas", () => {
  it("returns the value unchanged at runtime", () => {
    expect(MillisecondsSchema.parse(250)).toBe(250);
  });

  it.each([
    ["a negative value", -1],
    ["a fractional value", 1.5],
    ["NaN", Number.NaN],
  ])("rejects %s", (_label, value) => {
    expect(MillisecondsSchema.safeParse(value).success).toBe(false);
  });

  it("names the brand in its message", () => {
    const result = MillisecondsSchema.safeParse(-1);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("Milliseconds");
  });

  it("createBrandedIntSchema rejects fractions but allows negatives", () => {
    const OffsetSchema = createBrandedIntSchema("Offset");

    expect(OffsetSchema.parse(-3)).toBe(-3);
    expect(OffsetSchema.safeParse(1.5).success).toBe(false);
  });

  it("rejects infinity on a finite schema and zero on a positive one", () => {
    expect(createBrandedFiniteSchema("Ratio").safeParse(Number.POSITIVE_INFINITY).success).toBe(
      false,
    );
    expect(createBrandedPositiveIntSchema("Count").safeParse(0).success).toBe(false);
  });
});

describe("compile-time misuse", () => {
  it("refuses a mismatched unit", () => {
    const delay = unsafeAsBrandedNumber<"Seconds">(5);

    expect(takesMillis(secondsToMillis(delay))).toBe(5000);
    // @ts-expect-error Seconds is not Milliseconds
    expect(takesMillis(delay)).toBe(5);
    // @ts-expect-error a plain number is not branded
    expect(takesMillis(5)).toBe(5);
  });
});
