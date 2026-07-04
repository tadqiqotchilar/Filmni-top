import { describe, it, expect } from "vitest";
import { constantTimeEqual } from "../lib/adminAuth.js";

describe("constantTimeEqual", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeEqual("secret123", "secret123")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(constantTimeEqual("secret123", "secret456")).toBe(false);
  });

  it("returns false for different-length strings without throwing", () => {
    expect(constantTimeEqual("short", "a-much-longer-string")).toBe(false);
  });
});
