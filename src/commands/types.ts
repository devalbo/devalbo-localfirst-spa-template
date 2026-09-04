import type { Store } from "tinybase";

/**
 * Every command returns this. Commands never render — callers decide what to do
 * with the result. See docs/devalbo-principles/architecture/COMMAND_LAYER.md
 */
export interface CommandResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: { readonly code: ErrorCode; readonly message: string };
}

/** Closed union so callers can branch, and a new code is a reviewable addition. */
export type ErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "CONFLICT";

/**
 * Dependencies a command needs, injected rather than reached for. `now` and `newId`
 * are injected so commands are deterministic under test.
 */
export interface CommandContext {
  readonly store: Store;
  readonly now: () => Date;
  readonly newId: () => string;
}

export function ok<T>(data: T): CommandResult<T> {
  return { success: true, data };
}

export function fail<T = never>(code: ErrorCode, message: string): CommandResult<T> {
  return { success: false, error: { code, message } };
}
