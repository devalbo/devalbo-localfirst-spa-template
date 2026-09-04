import { describe, expect, it } from "vitest";
import {
  assertUuidKey,
  numberIndexKeyOf,
  unsafeAsHashKey,
  unsafeAsUuidKey,
  type UuidKey,
} from "@/ids/keys";
import {
  createHashIdToolbox,
  createNumberIndexIdToolbox,
  createUuidIdToolbox,
  type PrefixKeyId,
} from "@/ids/prefixKeyId";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

const GameIdToolbox = createUuidIdToolbox("game");
const SeatIdToolbox = createNumberIndexIdToolbox("seat");
const ContactIdToolbox = createHashIdToolbox("contact", { hashLength: 8 });

describe("createUuidIdToolbox", () => {
  it("composes prefix, separator and key", () => {
    const id = GameIdToolbox.createIdForKey(assertUuidKey(UUID));

    expect(id).toBe(`game_${UUID}`);
  });

  it("round-trips a key through createIdForKey and keyOf", () => {
    const key = assertUuidKey(UUID);

    expect(GameIdToolbox.keyOf(GameIdToolbox.createIdForKey(key))).toBe(key);
  });

  it("accepts its own output", () => {
    const id = GameIdToolbox.createIdForKey(assertUuidKey(UUID));

    expect(GameIdToolbox.parseId(id).success).toBe(true);
  });

  it.each([
    ["a bare uuid with no prefix", UUID],
    ["another family's prefix", `seat_${UUID}`],
    ["a prefix with no key", "game_"],
    ["a non-v4 uuid", "game_550e8400-e29b-11d4-a716-446655440000"],
    ["trailing content", `game_${UUID}x`],
    ["a non-string", 42],
  ])("rejects %s", (_label, value) => {
    expect(GameIdToolbox.parseId(value).success).toBe(false);
  });

  it("throws from assertId on an invalid id", () => {
    expect(() => GameIdToolbox.assertId("nope")).toThrow();
  });
});

describe("createNumberIndexIdToolbox", () => {
  it("defaults to no separator", () => {
    expect(SeatIdToolbox.createIdForKey(numberIndexKeyOf(42))).toBe("seat42");
  });

  it("round-trips through keyOf", () => {
    expect(SeatIdToolbox.keyOf(SeatIdToolbox.createIdForKey(numberIndexKeyOf(0)))).toBe("0");
  });

  it.each([
    ["a leading zero", "seat042"],
    ["a negative index", "seat-1"],
    ["a non-numeric key", "seatx"],
  ])("rejects %s", (_label, value) => {
    expect(SeatIdToolbox.parseId(value).success).toBe(false);
  });

  it("throws on a non-integer index rather than coercing it", () => {
    expect(() => numberIndexKeyOf(1.5)).toThrow(RangeError);
    expect(() => numberIndexKeyOf(-1)).toThrow(RangeError);
  });
});

describe("createHashIdToolbox", () => {
  it("honours the configured hash length", () => {
    expect(ContactIdToolbox.createIdForKey(unsafeAsHashKey("8a7b2c1d"))).toBe("contact_8a7b2c1d");
    expect(ContactIdToolbox.parseId("contact_8a7b2c1d").success).toBe(true);
    expect(ContactIdToolbox.parseId("contact_8a7b2c").success).toBe(false);
  });
});

describe("prefix isolation", () => {
  it("keeps same-key ids from different families distinct", () => {
    const key = assertUuidKey(UUID);
    const OtherToolbox = createUuidIdToolbox("other");

    expect(GameIdToolbox.parseId(OtherToolbox.createIdForKey(key)).success).toBe(false);
  });

  it("escapes regex metacharacters in a prefix", () => {
    const DottedToolbox = createUuidIdToolbox("a.b");

    expect(DottedToolbox.parseId(`axb_${UUID}`).success).toBe(false);
    expect(DottedToolbox.parseId(`a.b_${UUID}`).success).toBe(true);
  });

  it("rejects an empty prefix at construction", () => {
    expect(() => createUuidIdToolbox("")).toThrow(RangeError);
  });
});

type GameId = PrefixKeyId<"game", UuidKey>;
const takesGameId = (id: GameId): string => id;

describe("compile-time misuse", () => {
  it("refuses an id from another domain", () => {
    const gameId = GameIdToolbox.createIdForKey(unsafeAsUuidKey(UUID));
    const seatId = SeatIdToolbox.createIdForKey(numberIndexKeyOf(1));

    expect(takesGameId(gameId)).toBe(`game_${UUID}`);
    // @ts-expect-error a seat id is not a game id
    expect(() => takesGameId(seatId)).not.toThrow();
    // @ts-expect-error a plain string is not a branded id
    expect(() => takesGameId(`game_${UUID}`)).not.toThrow();
  });
});
