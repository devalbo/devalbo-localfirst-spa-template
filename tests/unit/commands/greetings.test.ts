import { describe, expect, it } from "vitest";
import { addGreeting, listGreetings, removeGreeting } from "@/commands/greetings";
import { TABLES } from "@/store/store";
import { createTestContext } from "../../helpers/command-context";

describe("addGreeting", () => {
  it("stores a greeting and returns it", () => {
    const ctx = createTestContext();

    const result = addGreeting(ctx, { name: "Ada" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: "greeting_00000000-0000-4000-8000-000000000001",
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

describe("the storage boundary", () => {
  it("writes the id as a primitive and re-brands it on read", () => {
    const ctx = createTestContext();
    const id = addGreeting(ctx, { name: "Ada" }).data?.id ?? "";

    // Nothing branded survives the write: the row key is a plain string and the
    // cells are primitives. See BRANDED_TYPES.md → Boundary Rules.
    expect(ctx.store.getRowIds(TABLES.greetings)).toEqual([id]);
    expect(ctx.store.getRow(TABLES.greetings, id)).toEqual({
      name: "Ada",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    // Reading back reparses through the schema, which is what re-applies the brand.
    expect(listGreetings(ctx).data?.[0]?.id).toBe(id);
  });

  it("refuses to hand back a row whose stored id is not a valid greeting id", () => {
    const ctx = createTestContext();
    ctx.store.setRow(TABLES.greetings, "not-a-greeting-id", {
      name: "Ada",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(() => listGreetings(ctx)).toThrow();
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

  it("reports NOT_FOUND for a well-formed id that isn't stored", () => {
    const ctx = createTestContext();

    const result = removeGreeting(ctx, "greeting_550e8400-e29b-41d4-a716-446655440000");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("NOT_FOUND");
  });

  it.each([
    ["a malformed id", "missing"],
    ["an unprefixed uuid", "550e8400-e29b-41d4-a716-446655440000"],
  ])("reports INVALID_INPUT for %s", (_label, id) => {
    const ctx = createTestContext();

    const result = removeGreeting(ctx, id);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("INVALID_INPUT");
  });
});
