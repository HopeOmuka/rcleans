import { describe, it, expect } from "vitest";
import { isWithinKenya, haversineKm } from "@/lib/map";

describe("isWithinKenya", () => {
  it("accepts Nairobi", () => {
    expect(isWithinKenya(-1.2921, 36.8219)).toBe(true);
  });

  it("rejects San Francisco (emulator default)", () => {
    expect(isWithinKenya(37.4219983, -122.084)).toBe(false);
  });

  it("rejects coordinates outside the Kenya bbox", () => {
    expect(isWithinKenya(0, 0)).toBe(false);
    expect(isWithinKenya(-10, 36)).toBe(false);
    expect(isWithinKenya(0, 50)).toBe(false);
  });
});

describe("haversineKm", () => {
  it("returns ~0 for identical coordinates", () => {
    expect(haversineKm(-1.2921, 36.8219, -1.2921, 36.8219)).toBe(0);
  });

  it("computes ~15,450 km between Nairobi and San Francisco", () => {
    const km = haversineKm(-1.2921, 36.8219, 37.4219983, -122.084);
    expect(km).toBeGreaterThan(15000);
    expect(km).toBeLessThan(16000);
  });

  it("computes a small distance for two Nairobi suburbs", () => {
    const km = haversineKm(-1.2921, 36.8219, -1.289001, 36.817281);
    expect(km).toBeGreaterThan(0.3);
    expect(km).toBeLessThan(1);
  });
});
