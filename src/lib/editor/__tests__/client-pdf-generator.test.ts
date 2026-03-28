import { describe, it, expect } from "vitest";

describe("client-pdf-generator", () => {
  it("exports generateClientPDF function", async () => {
    const mod = await import("../client-pdf-generator");
    expect(typeof mod.generateClientPDF).toBe("function");
  });

  it("generateClientPDF accepts correct parameter types", async () => {
    const mod = await import("../client-pdf-generator");
    // Verify function signature exists — actual DOM testing done in E2E
    expect(mod.generateClientPDF.length).toBe(3); // 3 params
  });
});
