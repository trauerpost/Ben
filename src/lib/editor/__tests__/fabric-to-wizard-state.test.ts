import { describe, it, expect } from "vitest";
import { fabricToWizardState } from "../fabric-to-wizard-state";
import { templateToFabricConfigs } from "../template-to-fabric";
import { getTemplateConfig } from "../template-configs";
import { getCanvasDimensions } from "../canvas-dimensions";

const STERBE_DIMS = getCanvasDimensions("sterbebild", "single");

describe("fabricToWizardState", () => {
  // ── Positive tests ──

  it("round-trip: template → fabricConfigs → mock canvas JSON → wizardState text fields match", () => {
    const template = getTemplateConfig("TI04")!;
    const inputText = { name: "Max Mustermann", heading: "In Gedenken" };
    const fabricConfigs = templateToFabricConfigs(template, STERBE_DIMS, inputText);

    // Build mock canvas JSON from fabric configs
    const canvasJSON = {
      version: "6.0.0",
      objects: fabricConfigs.map((fc) => ({
        type: fc.fabricType,
        text: fc.options.text,
        left: fc.options.left,
        top: fc.options.top,
        width: fc.options.width,
        height: fc.options.height,
        fontSize: fc.options.fontSize,
        fontFamily: fc.options.fontFamily,
        fontWeight: fc.options.fontWeight,
        textAlign: fc.options.textAlign,
        fill: fc.options.fill,
        data: fc.options.data,
      })),
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");

    expect(state.textContent.name).toBe("Max Mustermann");
    expect(state.textContent.heading).toBe("In Gedenken");
    expect(state.cardType).toBe("sterbebild");
    expect(state.cardFormat).toBe("single");
    expect(state.templateId).toBe("TI04");
  });

  it("image URL preserved in output", () => {
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "https://example.com/photo.jpg",
          left: 0,
          top: 0,
          width: 200,
          height: 300,
          data: { field: "photo", elementType: "image", templateElementId: "photo" },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBe("https://example.com/photo.jpg");
    expect(state.photo.originalUrl).toBe("https://example.com/photo.jpg");
  });

  it("font size overrides mapped correctly", () => {
    const canvasJSON = {
      objects: [
        {
          type: "textbox",
          text: "Big Name",
          fontSize: 36,
          data: { field: "name", templateElementId: "name" },
        },
        {
          type: "textbox",
          text: "Small Quote",
          fontSize: 8,
          data: { field: "quote", templateElementId: "quote" },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");
    expect(state.textContent.nameFontSize).toBe(36);
    expect(state.textContent.quoteFontSize).toBe(8);
  });

  it("background color extracted from canvas JSON", () => {
    const canvasJSON = {
      background: "#F5F0E8",
      objects: [],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");
    expect(state.background.type).toBe("color");
    expect(state.background.color).toBe("#F5F0E8");
  });

  it("background image URL extracted from canvas JSON", () => {
    const canvasJSON = {
      backgroundImage: { src: "https://example.com/bg.jpg" },
      objects: [],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");
    expect(state.background.type).toBe("image");
    expect(state.background.imageUrl).toBe("https://example.com/bg.jpg");
  });

  // ── Negative tests ──

  it("NEG: empty objects → default WizardState with given card metadata", () => {
    const canvasJSON = { objects: [] };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");
    expect(state.cardType).toBe("sterbebild");
    expect(state.templateId).toBe("TI04");
    expect(state.textContent.name).toBe("");
    expect(state.textContent.heading).toBe("");
    expect(state.photo.url).toBeNull();
  });

  it("NEG: object without data.field treated as free-form (not mapped to textContent)", () => {
    const canvasJSON = {
      objects: [
        {
          type: "textbox",
          text: "User's free text",
          left: 100,
          top: 100,
          width: 200,
          height: 50,
          // No data.field — this is user-added
        },
        {
          type: "textbox",
          text: "Bound Name",
          left: 50,
          top: 50,
          width: 200,
          height: 80,
          data: { field: "name", templateElementId: "name" },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");
    // Bound field mapped
    expect(state.textContent.name).toBe("Bound Name");
    // Free text NOT in any textContent field
    expect(Object.values(state.textContent)).not.toContain("User's free text");
  });

  it("NEG: missing canvasJSON.objects treated as empty", () => {
    const canvasJSON = {}; // no objects key

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");
    expect(state.textContent.name).toBe("");
    expect(state.cardType).toBe("sterbebild");
  });
});
