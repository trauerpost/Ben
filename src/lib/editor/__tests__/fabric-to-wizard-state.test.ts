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

  // ── Crop extraction tests ──

  it("photo crop extracted from position-based cover crop (centered)", () => {
    // Simulate: 1000x800 image scaled to cover a 200x300 slot
    // coverScale = max(200/1000, 300/800) = 0.375
    // Image rendered size: 1000*0.375=375w x 800*0.375=300h
    // Centered: left = 50 - (375-200)/2 = 50-87.5 = -37.5
    //           top = 100 - (300-300)/2 = 100
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "https://example.com/photo.jpg",
          left: -37.5,
          top: 100,
          width: 1000,
          height: 800,
          scaleX: 0.375,
          scaleY: 0.375,
          data: {
            field: "photo",
            elementType: "image",
            templateElementId: "photo",
            slotWidth: 200,
            slotHeight: 300,
            slotLeft: 50,
            slotTop: 100,
          },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBe("https://example.com/photo.jpg");
    expect(state.photo.crop).not.toBeNull();
    // Visible region: x = (50 - (-37.5)) / (1000 * 0.375) = 87.5/375 ≈ 0.2333
    //                 y = (100 - 100) / (800 * 0.375) = 0/300 = 0
    //                 w = 200 / (1000 * 0.375) = 200/375 ≈ 0.5333
    //                 h = 300 / (800 * 0.375) = 300/300 = 1.0
    expect(state.photo.crop!.x).toBeCloseTo(0.2333, 2);
    expect(state.photo.crop!.y).toBeCloseTo(0, 2);
    expect(state.photo.crop!.width).toBeCloseTo(0.5333, 2);
    expect(state.photo.crop!.height).toBeCloseTo(1.0, 2);
  });

  it("photo crop null when image fits exactly (no overflow)", () => {
    // Image scaled to exactly match slot — no crop needed
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "https://example.com/photo.jpg",
          left: 50,
          top: 100,
          width: 200,
          height: 300,
          scaleX: 1,
          scaleY: 1,
          data: {
            field: "photo",
            elementType: "image",
            templateElementId: "photo",
            slotWidth: 200,
            slotHeight: 300,
            slotLeft: 50,
            slotTop: 100,
          },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBe("https://example.com/photo.jpg");
    // No overflow = no crop
    expect(state.photo.crop).toBeNull();
  });

  it("NEG: photo crop without slot data → crop is null (no crash)", () => {
    // Image has no slot metadata — can't compute crop
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "https://example.com/photo.jpg",
          left: 0,
          top: 0,
          width: 200,
          height: 300,
          scaleX: 0.5,
          scaleY: 0.5,
          data: { field: "photo", elementType: "image", templateElementId: "photo" },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBe("https://example.com/photo.jpg");
    expect(state.photo.crop).toBeNull();
  });

  it("NEG: missing canvasJSON.objects treated as empty", () => {
    const canvasJSON = {}; // no objects key

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI04");
    expect(state.textContent.name).toBe("");
    expect(state.cardType).toBe("sterbebild");
  });

  // ── Bug fix: isImagePlaceholder must NOT block photo export ──

  it("isImagePlaceholder=true with placeholder URL → photo NOT exported", () => {
    // Original template placeholder photo must NOT be exported as user's photo.
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "/assets/photos/placeholder-man.jpg",
          left: 0,
          top: 0,
          width: 400,
          height: 600,
          data: {
            field: "photo",
            elementType: "image",
            templateElementId: "photo",
            isImagePlaceholder: true,
          },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBeNull();
  });

  it("isImagePlaceholder=true with user URL (stale flag) → photo IS exported", () => {
    // Old saved draft where PhotoToolbarPanel didn't clear the flag.
    // User uploaded a real photo but isImagePlaceholder stayed true.
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "https://example.com/user-uploaded-photo.jpg",
          left: 0,
          top: 0,
          width: 400,
          height: 600,
          data: {
            field: "photo",
            elementType: "image",
            templateElementId: "photo",
            isImagePlaceholder: true,
          },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBe("https://example.com/user-uploaded-photo.jpg");
  });

  it("BUG-FIX: image with isImagePlaceholder=false → photo URL exported (regression check)", () => {
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "https://example.com/photo.jpg",
          left: 0,
          top: 0,
          width: 200,
          height: 300,
          data: {
            field: "photo",
            elementType: "image",
            isImagePlaceholder: false,
          },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBe("https://example.com/photo.jpg");
  });

  it("BUG-FIX: image with no isImagePlaceholder flag → photo URL exported", () => {
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "https://example.com/photo.jpg",
          left: 0,
          top: 0,
          width: 200,
          height: 300,
          data: {
            field: "photo",
            elementType: "image",
          },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");
    expect(state.photo.url).toBe("https://example.com/photo.jpg");
  });

  it("NEG-BUG: user-replaced photo (was placeholder) preserves crop in WizardState", () => {
    // Simulates: user uploaded a tall portrait photo into a landscape slot
    // Photo: 600×900, Slot: 400×300
    // coverScale = max(400/600, 300/900) = 0.6667
    // Rendered: 600*0.667=400w × 900*0.667=600h
    // Centered: left=100, top=200-(600-300)/2=200-150=50
    const canvasJSON = {
      objects: [
        {
          type: "image",
          src: "blob:http://localhost:3000/user-upload-abc123",
          left: 100,
          top: 50,
          width: 600,
          height: 900,
          scaleX: 0.6667,
          scaleY: 0.6667,
          data: {
            field: "photo",
            elementType: "image",
            templateElementId: "photo",
            isImagePlaceholder: true,  // carried over from template
            slotWidth: 400,
            slotHeight: 300,
            slotLeft: 100,
            slotTop: 200,
          },
        },
      ],
    };

    const state = fabricToWizardState(canvasJSON, STERBE_DIMS, "sterbebild", "single", "TI05");

    expect(state.photo.url).toBe("blob:http://localhost:3000/user-upload-abc123");
    expect(state.photo.crop).not.toBeNull();
    // Visible: y = (200-50)/(900*0.6667) = 150/600.03 ≈ 0.25
    //          h = 300/(900*0.6667) = 300/600.03 ≈ 0.5
    //          x = (100-100)/(600*0.6667) = 0
    //          w = 400/(600*0.6667) = 400/400.02 ≈ 1.0
    expect(state.photo.crop!.x).toBeCloseTo(0, 2);
    expect(state.photo.crop!.y).toBeCloseTo(0.25, 2);
    expect(state.photo.crop!.width).toBeCloseTo(1.0, 2);
    expect(state.photo.crop!.height).toBeCloseTo(0.5, 2);
  });
});
