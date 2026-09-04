/**
 * Hard browser requirements, checked at startup. PROTOTYPE_BASELINE requires
 * feature-detecting these and saying so plainly rather than failing silently
 * somewhere deep in a call stack.
 */
export interface PlatformSupport {
  readonly supported: boolean;
  readonly missing: readonly string[];
}

export function checkPlatformSupport(): PlatformSupport {
  // Widening to Partial is what makes these checks type-honest: the lib types
  // declare these globals as always present, which is exactly the assumption
  // we're testing.
  const g = globalThis as Partial<typeof globalThis>;
  const missing: string[] = [];

  if (g.crypto?.randomUUID === undefined) missing.push("crypto.randomUUID");
  if (g.crypto?.subtle === undefined) missing.push("WebCrypto (crypto.subtle)");
  if (g.localStorage === undefined) missing.push("localStorage");
  if (g.structuredClone === undefined) missing.push("structuredClone");

  return { supported: missing.length === 0, missing };
}
