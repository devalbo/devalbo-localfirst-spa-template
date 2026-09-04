import { describe, expect, it } from "vitest";
import { GreetingSchema, NewGreetingSchema } from "@/schemas/greeting";

const valid = {
  id: "greeting_00000000-0000-4000-8000-000000000001",
  name: "Ada",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("GreetingSchema", () => {
  it("accepts a well-formed greeting", () => {
    expect(GreetingSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ["empty name", { ...valid, name: "" }],
    ["name over 80 chars", { ...valid, name: "x".repeat(81) }],
    ["non-uuid id", { ...valid, id: "greeting_not-a-uuid" }],
    ["id with no prefix", { ...valid, id: "00000000-0000-4000-8000-000000000001" }],
    [
      "id with another domain's prefix",
      { ...valid, id: "contact_00000000-0000-4000-8000-000000000001" },
    ],
    ["non-ISO timestamp", { ...valid, createdAt: "January 1st" }],
  ])("rejects %s", (_label, input) => {
    expect(GreetingSchema.safeParse(input).success).toBe(false);
  });
});

describe("NewGreetingSchema", () => {
  it("accepts only the caller-supplied field", () => {
    expect(NewGreetingSchema.parse({ name: "Ada" })).toEqual({ name: "Ada" });
  });

  it("rejects a missing name", () => {
    expect(NewGreetingSchema.safeParse({}).success).toBe(false);
  });
});
