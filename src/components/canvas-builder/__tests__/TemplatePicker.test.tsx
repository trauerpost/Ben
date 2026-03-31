import { describe, it, expect } from "vitest";
import { CARD_CONFIGS } from "../../../lib/editor/wizard-state";
import { getTemplateConfigsForCard } from "../../../lib/editor/template-configs";

/**
 * TemplatePicker logic tests — verifies the data that drives the UI.
 * Tests the actual template-configs + card-configs, not React rendering.
 */
describe("TemplatePicker logic", () => {
  it("3 card types available", () => {
    const types = Object.keys(CARD_CONFIGS);
    expect(types).toContain("sterbebild");
    expect(types).toContain("trauerkarte");
    expect(types).toContain("dankkarte");
    expect(types).toHaveLength(3);
  });

  it("Sterbebild shows 6 templates (TI04-TI09)", () => {
    const templates = getTemplateConfigsForCard("sterbebild", "single");
    expect(templates).toHaveLength(6);
    const ids = templates.map((t) => t.id);
    expect(ids).toContain("TI04");
    expect(ids).toContain("TI05");
    expect(ids).toContain("TI06");
    expect(ids).toContain("TI07");
    expect(ids).toContain("TI08");
    expect(ids).toContain("TI09");
  });

  it("Sterbebild has no format toggle (single only)", () => {
    const config = CARD_CONFIGS.sterbebild;
    expect(config.availableFormats).toEqual(["single"]);
  });

  it("Trauerkarte has format toggle (single + folded)", () => {
    const config = CARD_CONFIGS.trauerkarte;
    expect(config.availableFormats).toContain("single");
    expect(config.availableFormats).toContain("folded");
    expect(config.availableFormats).toHaveLength(2);
  });

  it("Dankkarte has format toggle (single + folded)", () => {
    const config = CARD_CONFIGS.dankkarte;
    expect(config.availableFormats).toContain("single");
    expect(config.availableFormats).toContain("folded");
  });

  it("onSelect would receive correct args for Sterbebild + TI05", () => {
    const templates = getTemplateConfigsForCard("sterbebild", "single");
    const ti05 = templates.find((t) => t.id === "TI05");
    expect(ti05).toBeDefined();
    expect(ti05!.cardType).toBe("sterbebild");
    expect(ti05!.cardFormat).toBe("single");
  });

  // ── Negative tests ──

  it("NEG: no templates for sterbebild folded (not a valid combo)", () => {
    const templates = getTemplateConfigsForCard("sterbebild", "folded");
    expect(templates).toHaveLength(0);
  });

  it("NEG: null format returns all templates for card type", () => {
    const templates = getTemplateConfigsForCard("sterbebild", null);
    expect(templates.length).toBeGreaterThan(0);
  });
});
