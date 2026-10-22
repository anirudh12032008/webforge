import { describe, expect, it } from "vitest";
import { parseWkbPoint, toEwkt } from "./geography";

// MANIT Bhopal main gate (77.4073, 23.2156) in the EWKB form PostGIS returns for geography(Point, 4326).
const EWKB_LE = "0101000020E61000004BEA0434115A53408104C58F31373740";

describe("geography point", () => {
  it("parses little-endian EWKB with SRID", () => {
    const p = parseWkbPoint(EWKB_LE);
    expect(p.lng).toBeCloseTo(77.4073, 4);
    expect(p.lat).toBeCloseTo(23.2156, 4);
  });

  it("parses plain WKB without SRID", () => {
    const p = parseWkbPoint("01010000004BEA0434115A53408104C58F31373740");
    expect(p).toEqual(parseWkbPoint(EWKB_LE));
  });

  it("formats EWKT longitude-first", () => {
    expect(toEwkt({ lng: 77.4073, lat: 23.2156 })).toBe("SRID=4326;POINT(77.4073 23.2156)");
  });
});
