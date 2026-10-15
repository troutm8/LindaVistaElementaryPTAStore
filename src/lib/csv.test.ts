import { describe, expect, it } from "vitest";
import { csvField, dollars, sheetTime, toCsv } from "./csv";

describe("csv", () => {
  it("quotes only when needed and doubles embedded quotes", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("has, comma")).toBe('"has, comma"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("two\nlines")).toBe('"two\nlines"');
    expect(csvField(null)).toBe("");
    expect(csvField(0)).toBe("0");
  });
  it("writes CRLF rows", () => {
    expect(toCsv([["a", "b"], [1, "x,y"]])).toBe('a,b\r\n1,"x,y"\r\n');
  });
  it("formats money and Pacific timestamps", () => {
    expect(dollars(1500)).toBe("15.00");
    expect(dollars(5)).toBe("0.05");
    // 21:38 UTC on Oct 15 is 14:38 PDT.
    expect(sheetTime(new Date("2026-10-15T21:38:00Z"))).toBe("2026-10-15 14:38");
    expect(sheetTime(null)).toBe("");
  });
});
