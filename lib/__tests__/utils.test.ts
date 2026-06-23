import { describe, it, expect } from "vitest";
import { formatTime, formatDate } from "@/lib/utils";

describe("formatTime", () => {
  it("returns minutes for < 60", () => {
    expect(formatTime(45)).toBe("45 min");
  });

  it("returns hours and minutes for >= 60", () => {
    expect(formatTime(90)).toBe("1h 30m");
  });

  it("handles 0", () => {
    expect(formatTime(0)).toBe("0 min");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2025-06-15T10:00:00Z");
    expect(result).toContain("June");
    expect(result).toContain("2025");
  });
});
