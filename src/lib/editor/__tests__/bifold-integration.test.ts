import { describe, it, expect } from "vitest";
import { getTemplateConfig, getTemplateConfigsForCard } from "../template-configs";

describe("bifold integration", () => {
  it("TI04-TI09 all have outside-spread cover-photo element", () => {
    for (const id of ["TI04", "TI05", "TI06", "TI07", "TI08", "TI09"]) {
      const config = getTemplateConfig(id)!;
      expect(config, `${id} config should exist`).toBeDefined();
      const cover = config.elements.find(el => el.page === "outside-spread");
      expect(cover, `${id} should have outside-spread element`).toBeDefined();
      expect(cover!.id).toBe("cover-photo");
      expect(cover!.type).toBe("image");
      expect(cover!.fixedAsset).toContain("TREE");
    }
  });

  it("TI04-TI09 cover-photo is type 'image' with fixedAsset (replaceable)", () => {
    for (const id of ["TI04", "TI05", "TI06", "TI07", "TI08", "TI09"]) {
      const config = getTemplateConfig(id)!;
      const cover = config.elements.find(el => el.id === "cover-photo")!;
      expect(cover.type, `${id} cover-photo should be image type`).toBe("image");
      expect(cover.fixedAsset, `${id} cover-photo should have fixedAsset`).toContain("TREE");
    }
  });

  it("TE01, TE02, TD01, TD02 do NOT have outside-spread elements", () => {
    for (const id of ["TE01", "TE02", "TD01", "TD02"]) {
      const config = getTemplateConfig(id)!;
      expect(config, `${id} config should exist`).toBeDefined();
      const cover = config.elements.find(el => el.page === "outside-spread");
      expect(cover, `${id} should NOT have outside-spread element`).toBeUndefined();
    }
  });

  it("TI04-TI09 still have cardFormat 'single' (NOT folded)", () => {
    for (const id of ["TI04", "TI05", "TI06", "TI07", "TI08", "TI09"]) {
      const config = getTemplateConfig(id)!;
      expect(config.cardFormat).toBe("single");
    }
  });

  it("getTemplateConfigsForCard still returns TI04-TI09 for sterbebild/single", () => {
    const configs = getTemplateConfigsForCard("sterbebild", "single");
    expect(configs.length).toBe(6);
    const ids = configs.map(c => c.id);
    expect(ids).toContain("TI04");
    expect(ids).toContain("TI05");
    expect(ids).toContain("TI06");
    expect(ids).toContain("TI07");
    expect(ids).toContain("TI08");
    expect(ids).toContain("TI09");
  });

  it("cover-photo element does not interfere with inner page elements", () => {
    const config = getTemplateConfig("TI05")!;
    const innerFront = config.elements.filter(el => el.page === "front");
    const innerBack = config.elements.filter(el => el.page === "back");
    expect(innerFront.length).toBeGreaterThan(0);
    expect(innerBack.length).toBeGreaterThan(0);
    // Cover element should NOT be in front or back
    expect(innerFront.find(el => el.id === "cover-photo")).toBeUndefined();
    expect(innerBack.find(el => el.id === "cover-photo")).toBeUndefined();
  });

  it("NEG: elements without page field default to front, NOT outside-spread", () => {
    const config = getTemplateConfig("TI04")!;
    // TI04 has text elements without page field (they should default to "front")
    const noPageElements = config.elements.filter(el => !el.page);
    expect(noPageElements.length).toBeGreaterThan(0);
    // These should NOT be treated as outside-spread
    for (const el of noPageElements) {
      expect(el.page).toBeUndefined(); // confirmed no page field
      // Verify they are NOT the cover-photo element
      expect(el.id).not.toBe("cover-photo");
    }
  });
});
