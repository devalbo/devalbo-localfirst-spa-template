import type { CommandContext } from "@/commands/types";
import { createAppStore } from "@/store/store";

/**
 * A context with a frozen clock and counted ids, so command tests assert on exact
 * values instead of whatever the wall clock happened to say.
 */
export function createTestContext(
  overrides: Readonly<Partial<CommandContext>> = {},
): CommandContext {
  let counter = 0;
  return {
    store: createAppStore(),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
    ...overrides,
  };
}
