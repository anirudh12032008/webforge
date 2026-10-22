import { customType } from "drizzle-orm/pg-core";
import type { LngLat } from "@/types";

const SRID_FLAG = 0x20000000;

/**
 * Decodes a PostGIS point from the hex (E)WKB that Postgres returns for geography columns.
 * Layout: 1 byte endianness, 4 bytes type (SRID flag adds a 4-byte SRID), then x and y as float64.
 */
export function parseWkbPoint(hex: string): LngLat {
  const buf = Buffer.from(hex, "hex");
  const le = buf.readUInt8(0) === 1;
  const type = le ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
  const offset = type & SRID_FLAG ? 9 : 5;
  const read = (at: number) => (le ? buf.readDoubleLE(at) : buf.readDoubleBE(at));
  return { lng: read(offset), lat: read(offset + 8) };
}

/**
 * Formats a point as EWKT, which Postgres casts implicitly to geography on insert.
 * Longitude comes first, as in every PostGIS (x, y) API.
 */
export function toEwkt({ lng, lat }: LngLat): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/** geography(Point, 4326) column mapped to `{ lng, lat }` in TypeScript. */
export const geographyPoint = customType<{ data: LngLat; driverData: string }>({
  dataType: () => "geography(Point, 4326)",
  toDriver: toEwkt,
  fromDriver: parseWkbPoint,
});

/**
 * geography(Polygon, 4326) column for org boundaries. Written as EWKT
 * ("SRID=4326;POLYGON((lng lat, ...))"); only used inside SQL (ST_Covers), so reads stay raw hex.
 */
export const geographyPolygon = customType<{ data: string; driverData: string }>({
  dataType: () => "geography(Polygon, 4326)",
});
