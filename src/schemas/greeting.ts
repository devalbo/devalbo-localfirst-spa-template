import { z } from "zod";
import type { UuidKey } from "@/ids/keys";
import { createUuidIdToolbox, type PrefixKeyId } from "@/ids/prefixKeyId";

/**
 * A structured, branded ID: `greeting_550e8400-…`. The prefix makes a stored or logged id
 * self-describing; the brand stops it being passed where another domain's id belongs.
 * See docs/devalbo-principles/architecture/BRANDED_TYPES.md
 */
export type GreetingId = PrefixKeyId<"greeting", UuidKey>;

export const GreetingIdToolbox = createUuidIdToolbox("greeting");

/**
 * The single source of truth for a greeting's shape. The TypeScript type is
 * derived from this schema and never hand-maintained alongside it.
 */
export const GreetingSchema = z.object({
  id: GreetingIdToolbox.schema,
  name: z.string().min(1).max(80),
  // UTC, ISO 8601. Stored in UTC and converted only for display.
  createdAt: z.iso.datetime(),
});

export type Greeting = z.infer<typeof GreetingSchema>;

/** Input accepted from outside; the rest is assigned by the command layer. */
export const NewGreetingSchema = GreetingSchema.pick({ name: true });

export type NewGreeting = z.infer<typeof NewGreetingSchema>;
