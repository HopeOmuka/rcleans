import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDate,
  formatChatTime,
  formatDateTime,
} from "@/lib/utils";

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

describe("formatChatTime", () => {
  it("returns a clock time for today", () => {
    const today = new Date();
    const result = formatChatTime(today.toISOString());
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("returns a date for an older timestamp", () => {
    const result = formatChatTime("2025-06-15T10:00:00Z");
    expect(result).not.toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });
});

describe("formatDateTime", () => {
  it("includes the date and a clock time", () => {
    const result = formatDateTime("2025-06-15T10:00:00Z");
    expect(result).toContain("June");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("returns an empty string for invalid input", () => {
    expect(formatDateTime("not-a-date")).toBe("");
  });
});
