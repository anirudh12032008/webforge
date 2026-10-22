import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a header and escapes commas, quotes and newlines", () => {
    const csv = toCsv([{ title: 'Pothole, "big"', count: 2, note: "line1\nline2" }], ["title", "count", "note"]);
    expect(csv).toBe('title,count,note\r\n"Pothole, ""big""",2,"line1\nline2"\r\n');
  });

  it("renders null as empty and neutralises spreadsheet formulas", () => {
    expect(toCsv([{ a: null, b: "=HYPERLINK(x)" }], ["a", "b"])).toBe("a,b\r\n,'=HYPERLINK(x)\r\n");
  });
});
