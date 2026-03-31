import { describe, it, expect, vi } from "vitest";
import { templateToFabricConfigs } from "../template-to-fabric";
import { getTemplateConfig } from "../template-configs";
import { getCanvasDimensions } from "../canvas-dimensions";
import type { TemplateConfig, TemplateElement } from "../template-configs";
import type { CanvasDimensions } from "../canvas-dimensions";
import type { TextContent } from "../wizard-state";

const STERBE_DIMS = getCanvasDimensions("sterbebild", "single"); // 827×620

describe("templateToFabricConfigs", () => {
  // ── Positive tests ──

  it("TI04 produces correct element count (7)", () => {
    const config = getTemplateConfig("TI04")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    expect(results).toHaveLength(7);
  });

  it("TI05 produces correct element count (9)", () => {
    const config = getTemplateConfig("TI05")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    expect(results).toHaveLength(9);
  });

  it("coordinate mapping: {x:100,y:200} on 827×620 → left≈82.7, top≈124", () => {
    const mockTemplate: TemplateConfig = {
      id: "TEST",
      name: "Test",
      description: "Test",
      referenceImage: "",
      cardType: "sterbebild",
      cardFormat: "single",
      spreadWidthMm: 140,
      spreadHeightMm: 105,
      requiredFields: [],
      requiresPhoto: false,
      thumbnail: { previewName: "Test", previewDates: "Test" },
      elements: [
        { id: "t1", type: "text", x: 100, y: 200, w: 800, h: 100, field: "name", fontSize: 12 },
      ],
    };

    const results = templateToFabricConfigs(mockTemplate, STERBE_DIMS);
    expect(results).toHaveLength(1);

    const opts = results[0].options;
    // 100/1000 * 827 = 82.7
    expect(opts.left).toBeCloseTo(82.7, 0);
    // 200/1000 * 620 = 124
    expect(opts.top).toBeCloseTo(124, 0);
    // 800/1000 * 827 = 661.6
    expect(opts.width).toBeCloseTo(661.6, 0);
    // 100/1000 * 620 = 62
    expect(opts.height).toBeCloseTo(62, 0);
  });

  it("text pre-fill: field:'name' + textContent:{name:'Max'} → text='Max'", () => {
    const config = getTemplateConfig("TI04")!;
    const tc: Partial<TextContent> = { name: "Max Mustermann" };
    const results = templateToFabricConfigs(config, STERBE_DIMS, tc);
    const nameEl = results.find((r) => r.field === "name");
    expect(nameEl).toBeDefined();
    expect(nameEl!.options.text).toBe("Max Mustermann");
  });

  it("font properties preserved from template element", () => {
    const config = getTemplateConfig("TI05")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    const nameEl = results.find((r) => r.field === "name");
    expect(nameEl).toBeDefined();
    expect(nameEl!.options.fontFamily).toBe("Cormorant Garamond");
    expect(nameEl!.options.fontWeight).toBe("bold");
    expect(nameEl!.options.textAlign).toBe("center");
  });

  it("global fontFamily from textContent used when element has no override", () => {
    const config = getTemplateConfig("TI04")!;
    const tc: Partial<TextContent> = { fontFamily: "Inter", name: "Test" };
    const results = templateToFabricConfigs(config, STERBE_DIMS, tc);
    // TI04 name element uses "Pinyon Script" override, but heading doesn't
    const heading = results.find((r) => r.field === "heading");
    expect(heading).toBeDefined();
    // heading has no fontFamily override in TI04, so should use global
    expect(heading!.options.fontFamily).toBe("Inter");
  });

  it("image element produces rect placeholder", () => {
    const config = getTemplateConfig("TI05")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    const photo = results.find((r) => r.field === "photo");
    expect(photo).toBeDefined();
    expect(photo!.fabricType).toBe("rect");
    expect(photo!.options.fill).toBe("#f5f5f5");
    expect(photo!.options.strokeDashArray).toEqual([6, 4]);
    // TI05 photo has useCrop but no imageClip
    expect(photo!.meta?.useCrop).toBe(true);
  });

  it("image element with imageClip='rounded' has rounded corners", () => {
    // TI07 photo has imageClip: "rounded"
    const config = getTemplateConfig("TI07")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    const photo = results.find((r) => r.field === "photo");
    expect(photo).toBeDefined();
    expect(photo!.meta?.imageClip).toBe("rounded");
    expect(photo!.options.rx).toBe(8);
    expect(photo!.options.ry).toBe(8);
  });

  it("line element produces line config", () => {
    const config = getTemplateConfig("TI05")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    const line = results.find((r) => r.fabricType === "line");
    expect(line).toBeDefined();
    expect(line!.options.stroke).toBeDefined();
    expect(line!.options.strokeWidth).toBeDefined();
  });

  it("ornament element produces image config with fixedAsset", () => {
    const config = getTemplateConfig("TI07")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    const ornament = results.find((r) => r.fabricType === "image");
    expect(ornament).toBeDefined();
    expect(ornament!.meta?.fixedAsset).toContain("cross-rose-vine.svg");
  });

  it("every element has data property with templateElementId", () => {
    const config = getTemplateConfig("TI04")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    for (const r of results) {
      const data = r.options.data as Record<string, unknown>;
      expect(data).toBeDefined();
      expect(data.templateElementId).toBeDefined();
      expect(typeof data.templateElementId).toBe("string");
    }
  });

  it("text elements with field have data.field set", () => {
    const config = getTemplateConfig("TI04")!;
    const results = templateToFabricConfigs(config, STERBE_DIMS);
    const nameEl = results.find((r) => r.field === "name");
    const data = nameEl!.options.data as Record<string, unknown>;
    expect(data.field).toBe("name");
  });

  // ── Negative tests ──

  it("NEG: unknown element type → skipped with console.warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const mockTemplate: TemplateConfig = {
      id: "TEST",
      name: "Test",
      description: "",
      referenceImage: "",
      cardType: "sterbebild",
      cardFormat: "single",
      spreadWidthMm: 140,
      spreadHeightMm: 105,
      requiredFields: [],
      requiresPhoto: false,
      thumbnail: { previewName: "", previewDates: "" },
      elements: [
        { id: "bad", type: "unknown" as never, x: 0, y: 0, w: 100, h: 100 },
        { id: "good", type: "text", x: 0, y: 0, w: 100, h: 100, field: "name", fontSize: 12 },
      ],
    };

    const results = templateToFabricConfigs(mockTemplate, STERBE_DIMS);
    expect(results).toHaveLength(1); // only the text element
    expect(results[0].id).toBe("good");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown element type")
    );

    warnSpy.mockRestore();
  });

  it("NEG: empty elements array → empty result", () => {
    const mockTemplate: TemplateConfig = {
      id: "TEST",
      name: "Test",
      description: "",
      referenceImage: "",
      cardType: "sterbebild",
      cardFormat: "single",
      spreadWidthMm: 140,
      spreadHeightMm: 105,
      requiredFields: [],
      requiresPhoto: false,
      thumbnail: { previewName: "", previewDates: "" },
      elements: [],
    };

    const results = templateToFabricConfigs(mockTemplate, STERBE_DIMS);
    expect(results).toHaveLength(0);
  });
});
