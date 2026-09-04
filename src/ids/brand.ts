declare const brand: unique symbol;

/**
 * A compile-time-only tag. `Branded<string, "X">` is still a `string` at runtime — the
 * brand exists solely so the compiler can refuse a value from the wrong domain.
 *
 * Brands do not survive `JSON.stringify` or a TinyBase write. Re-apply them with a
 * `parse`/`assert` on the way back in.
 * See docs/devalbo-principles/architecture/BRANDED_TYPES.md
 */
export type Branded<T, B> = T & { readonly [brand]: B };
