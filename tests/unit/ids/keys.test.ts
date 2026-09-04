import { describe, expect, it } from "vitest";
import {
  assertHashKey,
  assertNumberIndexKey,
  assertUuidKey,
  hashKeyMethodology,
  numberIndexKeyMethodology,
  parseNumberIndexKey,
  parseUuidKey,
  unsafeAsHashKey,
  unsafeAsUuidKey,
  uuidKeyMethodology,
} from "@/ids/keys";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("constructor tiers", () => {
  it("parseUuidKey reports failure instead of throwing", () => {
    expect(parseUuidKey(UUID).success).toBe(true);
    expect(parseUuidKey("nope").success).toBe(false);
    expect(parseUuidKey(42).success).toBe(false);
  });

  it("assertUuidKey throws on invalid input", () => {
    expect(assertUuidKey(UUID)).toBe(UUID);
    expect(() => assertUuidKey("nope")).toThrow();
  });

  it("unsafeAsUuidKey does not validate — that is the point of the tier", () => {
    expect(unsafeAsUuidKey("definitely-not-a-uuid")).toBe("definitely-not-a-uuid");
  });

  it("parseNumberIndexKey and assertNumberIndexKey agree on validity", () => {
    expect(parseNumberIndexKey("42").success).toBe(true);
    expect(parseNumberIndexKey("042").success).toBe(false);
    expect(assertNumberIndexKey("42")).toBe("42");
    expect(() => assertNumberIndexKey("042")).toThrow();
  });

  it("assertHashKey enforces the requested length", () => {
    expect(assertHashKey("8a7b2c1d", 8)).toBe("8a7b2c1d");
    expect(() => assertHashKey("8a7b2c1d", 16)).toThrow();
    expect(() => assertHashKey("NOTHEX01", 8)).toThrow();
  });

  it("unsafeAsHashKey does not validate", () => {
    expect(unsafeAsHashKey("zzzz")).toBe("zzzz");
  });
});

describe("methodologies", () => {
  it("name themselves for use in error messages", () => {
    expect(uuidKeyMethodology.name).toBe("uuid");
    expect(numberIndexKeyMethodology.name).toBe("number-index");
    expect(hashKeyMethodology(16).name).toBe("hash-16");
  });

  it("reject a nonsensical hash length at construction", () => {
    expect(() => hashKeyMethodology(2)).toThrow(RangeError);
    expect(() => hashKeyMethodology(8.5)).toThrow(RangeError);
  });
});
