import { GreetingSchema, NewGreetingSchema, type Greeting } from "@/schemas/greeting";
import { TABLES } from "@/store/store";
import { fail, ok, type CommandContext, type CommandResult } from "./types";

/**
 * Adds a greeting. Untrusted input is parsed once here, at the boundary; everything
 * downstream works on a validated `Greeting`.
 */
export function addGreeting(ctx: CommandContext, input: unknown): CommandResult<Greeting> {
  const parsed = NewGreetingSchema.safeParse(input);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid greeting");
  }

  const greeting: Greeting = {
    id: ctx.newId(),
    name: parsed.data.name,
    createdAt: ctx.now().toISOString(),
  };

  // Parse again before writing: malformed data must not be able to land in the store.
  const row = GreetingSchema.parse(greeting);
  ctx.store.setRow(TABLES.greetings, row.id, { name: row.name, createdAt: row.createdAt });

  return ok(row);
}

export function listGreetings(ctx: CommandContext): CommandResult<readonly Greeting[]> {
  const table = ctx.store.getTable(TABLES.greetings);
  const greetings = Object.entries(table).map(([id, row]) =>
    GreetingSchema.parse({ id, name: row["name"], createdAt: row["createdAt"] }),
  );
  return ok(greetings);
}

export function removeGreeting(ctx: CommandContext, id: string): CommandResult<null> {
  if (!ctx.store.hasRow(TABLES.greetings, id)) {
    return fail("NOT_FOUND", `No greeting with id ${id}`);
  }
  ctx.store.delRow(TABLES.greetings, id);
  return ok(null);
}
