import { assertUuidKey } from "@/ids/keys";
import {
  GreetingIdToolbox,
  GreetingSchema,
  NewGreetingSchema,
  type Greeting,
} from "@/schemas/greeting";
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

  // Randomness stays injected: the key comes from `ctx.newId()`, never from `crypto` here.
  const greeting: Greeting = {
    id: GreetingIdToolbox.createIdForKey(assertUuidKey(ctx.newId())),
    name: parsed.data.name,
    createdAt: ctx.now().toISOString(),
  };

  // Parse again before writing: malformed data must not be able to land in the store.
  const row = GreetingSchema.parse(greeting);
  ctx.store.setRow(TABLES.greetings, row.id, { name: row.name, createdAt: row.createdAt });

  return ok(row);
}

/** The store holds primitives, so the id is re-branded on the way out. */
export function listGreetings(ctx: CommandContext): CommandResult<readonly Greeting[]> {
  const table = ctx.store.getTable(TABLES.greetings);
  const greetings = Object.entries(table).map(([id, row]) =>
    GreetingSchema.parse({ id, name: row["name"], createdAt: row["createdAt"] }),
  );
  return ok(greetings);
}

/**
 * `id` arrives from a component as a plain string, so it is parsed here rather than
 * trusted. A malformed id and an absent one are different failures and say so.
 */
export function removeGreeting(ctx: CommandContext, id: unknown): CommandResult<null> {
  const parsed = GreetingIdToolbox.parseId(id);
  if (!parsed.success) {
    return fail("INVALID_INPUT", `Not a greeting id: ${String(id)}`);
  }

  if (!ctx.store.hasRow(TABLES.greetings, parsed.data)) {
    return fail("NOT_FOUND", `No greeting with id ${parsed.data}`);
  }
  ctx.store.delRow(TABLES.greetings, parsed.data);
  return ok(null);
}
