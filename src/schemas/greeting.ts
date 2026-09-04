import { z } from "zod";

/**
 * The single source of truth for a greeting's shape. The TypeScript type is
 * derived from this schema and never hand-maintained alongside it.
 */
export const GreetingSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  // UTC, ISO 8601. Stored in UTC and converted only for display.
  createdAt: z.iso.datetime(),
});

export type Greeting = z.infer<typeof GreetingSchema>;

/** Input accepted from outside; the rest is assigned by the command layer. */
export const NewGreetingSchema = GreetingSchema.pick({ name: true });

export type NewGreeting = z.infer<typeof NewGreetingSchema>;
