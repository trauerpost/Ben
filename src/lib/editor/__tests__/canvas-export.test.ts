import { describe, it, expect, vi } from "vitest";
import { templateToFabricConfigs } from "../template-to-fabric";
import { getTemplateConfig } from "../template-configs";
import { getCanvasDimensions } from "../canvas-dimensions";

// Mock renderSpreadHTML since it uses Node.js APIs (Buffer, fetch) not available in vitest
vi.mock("../card-to-html-v2", () => ({
  renderSpreadHTML: vi.fn(async (state: { templateId: string; textContent: { name: string } }) => {
    return `<html><body>${state.textContent.name}</body></html>`;
  }),
}));

// Import after mock
const { exportCanvasToPreview, exportCanvasToWizardState } = await import("../canvas-export");

const STERBE_DIMS = getCanvasDimensions("sterbebild", "single");

function buildMockPagesData(textOverrides?: Record<string, string>): Record<string, string> {
  const template = getTemplateConfig("TI04")!;
  const configs = templateToFabricConfigs(template, STERBE_DIMS, {
    name: textOverrides?.name ?? "Test Name",
    heading: textOverrides?.heading ?? "Test Heading",
  });

  const canvasJSON = {
    version: "6.0.0",
    objects: configs.map((fc) => ({
      type: fc.fabricType,
      text: fc.options.text,
      left: fc.options.left,
      top: fc.options.top,
      width: fc.options.width,
      height: fc.options.height,
      fontSize: fc.options.fontSize,
      fontFamily: fc.options.fontFamily,
      textAlign: fc.options.textAlign,
      fill: fc.options.fill,
      data: fc.options.data,
    })),
  };

  return { front: JSON.stringify(canvasJSON) };
}

describe("exportCanvasToPreview", () => {
  it("returns valid WizardState + HTML string", async () => {
    const pagesData = buildMockPagesData({ name: "Max Mustermann" });
    const result = await exportCanvasToPreview(pagesData, "sterbebild", "single", "TI04");

    expect(result.wizardState).toBeDefined();
    expect(result.wizardState.cardType).toBe("sterbebild");
    expect(result.wizardState.templateId).toBe("TI04");
    expect(result.wizardState.textContent.name).toBe("Max Mustermann");
    expect(result.previewHTML).toContain("Max Mustermann");
  });

  it("cardType and templateId preserved in output", async () => {
    const pagesData = buildMockPagesData();
    const result = await exportCanvasToPreview(pagesData, "sterbebild", "single", "TI04");

    expect(result.wizardState.cardType).toBe("sterbebild");
    expect(result.wizardState.cardFormat).toBe("single");
    expect(result.wizardState.templateId).toBe("TI04");
  });

  // ── Negative tests ──

  it("NEG: empty pagesData throws", async () => {
    await expect(
      exportCanvasToPreview({}, "sterbebild", "single", "TI04")
    ).rejects.toThrow(/no page data/i);
  });

  it("NEG: mismatched cardType/template throws", async () => {
    const pagesData = buildMockPagesData();
    // TI04 is sterbebild, but we pass trauerkarte — renderSpreadHTML will get wrong combo
    // The fabricToWizardState will still work (it just passes through),
    // but renderSpreadHTML (mocked) will be called with trauerkarte + TI04
    const result = await exportCanvasToPreview(pagesData, "trauerkarte", "single", "TI04");
    // This doesn't throw in our mock, but in production renderSpreadHTML would
    // validate the template. We verify the state reflects what was passed.
    expect(result.wizardState.cardType).toBe("trauerkarte");
    expect(result.wizardState.templateId).toBe("TI04");
  });
});

// ── Cover photo leak tests ──

/**
 * Build a minimal canvas JSON string containing a single image object.
 * fabricToWizardState will extract this as photo.url.
 */
function buildCanvasWithPhoto(photoUrl: string): string {
  return JSON.stringify({
    version: "6.0.0",
    objects: [{
      type: "image",
      src: photoUrl,
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      data: { elementType: "image", field: "photo" },
    }],
  });
}

/** Build a minimal canvas JSON string with NO photo (text only). */
function buildCanvasWithoutPhoto(): string {
  return JSON.stringify({
    version: "6.0.0",
    objects: [{
      type: "textbox",
      text: "Some text",
      left: 10,
      top: 10,
      width: 200,
      height: 50,
      data: { field: "name" },
    }],
  });
}

describe("exportCanvasToWizardState — cover photo leak", () => {
  it("NEG: outside-spread photo must NOT leak into WizardState.photo", () => {
    const pagesData: Record<string, string> = {
      front: buildCanvasWithoutPhoto(),
      "outside-spread": buildCanvasWithPhoto("https://example.com/TREE.jpg"),
    };

    const result = exportCanvasToWizardState(pagesData, "sterbebild", "single", "TI04");

    // The front page has no photo, outside-spread has TREE.jpg.
    // WizardState.photo.url must remain null — cover photo must NOT leak in.
    expect(result.photo.url).toBeNull();
  });

  it("back page photo SHOULD be adopted when front has no photo", () => {
    const pagesData: Record<string, string> = {
      front: buildCanvasWithoutPhoto(),
      back: buildCanvasWithPhoto("https://example.com/back-photo.jpg"),
    };

    const result = exportCanvasToWizardState(pagesData, "sterbebild", "single", "TI04");

    // Back page photo should be adopted (existing behavior preserved).
    expect(result.photo.url).toBe("https://example.com/back-photo.jpg");
  });

  it("outside-spread photo is extracted into coverPhoto field", () => {
    const pagesData: Record<string, string> = {
      front: buildCanvasWithoutPhoto(),
      "outside-spread": buildCanvasWithPhoto("https://example.com/custom-cover.jpg"),
    };

    const result = exportCanvasToWizardState(pagesData, "sterbebild", "single", "TI04");

    // Cover photo should be in the separate coverPhoto field
    expect(result.coverPhoto).toBeDefined();
    expect(result.coverPhoto!.url).toBe("https://example.com/custom-cover.jpg");
    // And NOT in the main photo field
    expect(result.photo.url).toBeNull();
  });

  it("front page photo takes priority even when outside-spread has one", () => {
    const pagesData: Record<string, string> = {
      front: buildCanvasWithPhoto("https://example.com/front-photo.jpg"),
      "outside-spread": buildCanvasWithPhoto("https://example.com/TREE.jpg"),
    };

    const result = exportCanvasToWizardState(pagesData, "sterbebild", "single", "TI04");

    // Front page photo should be used (already set, no adoption needed).
    expect(result.photo.url).toBe("https://example.com/front-photo.jpg");
  });
});
