import { describe, expect, it } from "vitest";
import { addGreeting, listGreetings, removeGreeting } from "@/commands/greetings";
import { createTestContext } from "../../helpers/command-context";

describe("addGreeting", () => {
  it("stores a greeting and returns it", () => {
    const ctx = createTestContext();

    const result = addGreeting(ctx, { name: "Ada" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Ada",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it.each([
    ["an empty name", { name: "" }],
    ["a missing name", {}],
    ["a non-string name", { name: 42 }],
  ])("rejects %s without writing to the store", (_label, input) => {
    const ctx = createTestContext();

    const result = addGreeting(ctx, input);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("INVALID_INPUT");
    expect(listGreetings(ctx).data).toHaveLength(0);
  });
});

describe("listGreetings", () => {
  it("returns greetings that were added", () => {
    const ctx = createTestContext();
    addGreeting(ctx, { name: "Ada" });
    addGreeting(ctx, { name: "Grace" });

    const names = listGreetings(ctx).data?.map((g) => g.name);

    expect(names).toEqual(["Ada", "Grace"]);
  });
});

describe("removeGreeting", () => {
  it("removes an existing greeting", () => {
    const ctx = createTestContext();
    const added = addGreeting(ctx, { name: "Ada" });

    const result = removeGreeting(ctx, added.data?.id ?? "");

    expect(result.success).toBe(true);
    expect(listGreetings(ctx).data).toHaveLength(0);
  });

  it("reports NOT_FOUND for an unknown id", () => {
    const ctx = createTestContext();

    const result = removeGreeting(ctx, "missing");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("NOT_FOUND");
  });
});
