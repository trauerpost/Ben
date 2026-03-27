import { describe, it, expect } from "vitest";
import {
  wizardReducer,
  isStepValid,
  initialWizardState,
  TOTAL_STEPS,
  type WizardState,
  type WizardAction,
} from "../wizard-state";

// Helper: fresh state copy to avoid cross-test mutation
function freshState(overrides?: Partial<WizardState>): WizardState {
  return { ...structuredClone(initialWizardState), ...overrides };
}

// ─── wizardReducer ───────────────────────────────────────────────────────────

describe("wizardReducer", () => {
  // -- SET_CARD_TYPE --
  describe("SET_CARD_TYPE", () => {
    it("sets cardType and resets templateId", () => {
      const state = freshState({ templateId: "tpl-1" });
      const next = wizardReducer(state, { type: "SET_CARD_TYPE", cardType: "trauerkarte" });
      expect(next.cardType).toBe("trauerkarte");
      expect(next.templateId).toBeNull();
    });

    it("auto-selects format when card type has only one format (sterbebild)", () => {
      const next = wizardReducer(freshState(), { type: "SET_CARD_TYPE", cardType: "sterbebild" });
      expect(next.cardFormat).toBe("single");
    });

    it("sets format to null when card type has multiple formats (trauerkarte)", () => {
      const state = freshState({ cardFormat: "single" });
      const next = wizardReducer(state, { type: "SET_CARD_TYPE", cardType: "trauerkarte" });
      expect(next.cardFormat).toBeNull();
    });

    it("sets format to null when card type has multiple formats (dankkarte)", () => {
      const next = wizardReducer(freshState(), { type: "SET_CARD_TYPE", cardType: "dankkarte" });
      expect(next.cardFormat).toBeNull();
    });
  });

  // -- SET_CARD_FORMAT --
  describe("SET_CARD_FORMAT", () => {
    it("sets cardFormat and resets templateId", () => {
      const state = freshState({ cardType: "trauerkarte", templateId: "tpl-2" });
      const next = wizardReducer(state, { type: "SET_CARD_FORMAT", cardFormat: "folded" });
      expect(next.cardFormat).toBe("folded");
      expect(next.templateId).toBeNull();
    });
  });

  // -- SET_TEMPLATE --
  describe("SET_TEMPLATE", () => {
    it("sets templateId", () => {
      const next = wizardReducer(freshState(), { type: "SET_TEMPLATE", templateId: "tpl-abc" });
      expect(next.templateId).toBe("tpl-abc");
    });
  });

  // -- SET_BACKGROUND --
  describe("SET_BACKGROUND", () => {
    it("sets the full background object", () => {
      const bg = { type: "image" as const, color: "#000", imageUrl: "https://example.com/bg.jpg" };
      const next = wizardReducer(freshState(), { type: "SET_BACKGROUND", background: bg });
      expect(next.background).toEqual(bg);
    });
  });

  // -- SET_PHOTO --
  describe("SET_PHOTO", () => {
    it("sets photo url", () => {
      const next = wizardReducer(freshState(), { type: "SET_PHOTO", url: "https://example.com/photo.jpg" });
      expect(next.photo.url).toBe("https://example.com/photo.jpg");
    });

    it("preserves existing crop when setting photo url", () => {
      const crop = { x: 10, y: 20, width: 100, height: 100 };
      const state = freshState();
      state.photo.crop = crop;
      const next = wizardReducer(state, { type: "SET_PHOTO", url: "https://new-photo.jpg" });
      expect(next.photo.crop).toEqual(crop);
    });
  });

  // -- SET_PHOTO_CROP --
  describe("SET_PHOTO_CROP", () => {
    it("sets photo crop", () => {
      const crop = { x: 5, y: 10, width: 200, height: 150 };
      const next = wizardReducer(freshState(), { type: "SET_PHOTO_CROP", crop });
      expect(next.photo.crop).toEqual(crop);
    });

    it("allows setting crop to null", () => {
      const state = freshState();
      state.photo.crop = { x: 0, y: 0, width: 50, height: 50 };
      const next = wizardReducer(state, { type: "SET_PHOTO_CROP", crop: null });
      expect(next.photo.crop).toBeNull();
    });
  });

  // -- SET_TEXT_STRING --
  describe("SET_TEXT_STRING", () => {
    const stringFields = [
      "heading", "name", "dates", "dividerSymbol", "quote",
      "fontFamily", "fontColor", "relationshipLabels", "birthDate",
      "deathDate", "locationBirth", "locationDeath", "quoteAuthor", "closingVerse",
    ] as const;

    for (const field of stringFields) {
      it(`sets textContent.${field}`, () => {
        const next = wizardReducer(freshState(), { type: "SET_TEXT_STRING", field, value: "test-value" });
        expect(next.textContent[field]).toBe("test-value");
      });
    }
  });

  // -- SET_TEXT_NUMBER --
  describe("SET_TEXT_NUMBER", () => {
    const numberFields = [
      "headingFontSize", "nameFontSize", "datesFontSize", "quoteFontSize",
      "locationFontSize", "closingVerseFontSize", "quoteAuthorFontSize",
    ] as const;

    for (const field of numberFields) {
      it(`sets textContent.${field}`, () => {
        const next = wizardReducer(freshState(), { type: "SET_TEXT_NUMBER", field, value: 42 });
        expect(next.textContent[field]).toBe(42);
      });
    }
  });

  // -- SET_TEXT_ALIGN --
  describe("SET_TEXT_ALIGN", () => {
    it("sets textAlign to left", () => {
      const next = wizardReducer(freshState(), { type: "SET_TEXT_ALIGN", align: "left" });
      expect(next.textContent.textAlign).toBe("left");
    });

    it("sets textAlign to right", () => {
      const next = wizardReducer(freshState(), { type: "SET_TEXT_ALIGN", align: "right" });
      expect(next.textContent.textAlign).toBe("right");
    });
  });

  // -- SET_DECORATION --
  describe("SET_DECORATION", () => {
    it("sets decoration asset", () => {
      const next = wizardReducer(freshState(), {
        type: "SET_DECORATION", assetId: "dec-1", assetUrl: "https://example.com/dec.png",
      });
      expect(next.decoration).toEqual({ assetId: "dec-1", assetUrl: "https://example.com/dec.png" });
    });

    it("clears decoration when null", () => {
      const state = freshState();
      state.decoration = { assetId: "old", assetUrl: "old-url" };
      const next = wizardReducer(state, { type: "SET_DECORATION", assetId: null, assetUrl: null });
      expect(next.decoration).toEqual({ assetId: null, assetUrl: null });
    });
  });

  // -- SET_BORDER --
  describe("SET_BORDER", () => {
    it("sets border", () => {
      const next = wizardReducer(freshState(), { type: "SET_BORDER", id: "bdr-1", url: "https://border.png" });
      expect(next.border).toEqual({ id: "bdr-1", url: "https://border.png" });
    });

    it("clears border when null", () => {
      const next = wizardReducer(freshState(), { type: "SET_BORDER", id: null, url: null });
      expect(next.border).toEqual({ id: null, url: null });
    });
  });

  // -- SET_CORNERS --
  describe("SET_CORNERS", () => {
    it("sets corners arrays", () => {
      const next = wizardReducer(freshState(), {
        type: "SET_CORNERS", ids: ["c1", "c2"], urls: ["url1", "url2"],
      });
      expect(next.corners).toEqual({ ids: ["c1", "c2"], urls: ["url1", "url2"] });
    });
  });

  // -- SET_STEP --
  describe("SET_STEP", () => {
    it("sets currentStep to a valid step", () => {
      const next = wizardReducer(freshState(), { type: "SET_STEP", step: 5 });
      expect(next.currentStep).toBe(5);
    });

    it("allows setting step to 0 (no clamping in SET_STEP)", () => {
      const next = wizardReducer(freshState(), { type: "SET_STEP", step: 0 });
      expect(next.currentStep).toBe(0);
    });

    it("allows setting step beyond TOTAL_STEPS (no clamping in SET_STEP)", () => {
      const next = wizardReducer(freshState(), { type: "SET_STEP", step: 99 });
      expect(next.currentStep).toBe(99);
    });
  });

  // -- NEXT_STEP --
  describe("NEXT_STEP", () => {
    it("increments currentStep by 1", () => {
      const state = freshState({ currentStep: 3 });
      const next = wizardReducer(state, { type: "NEXT_STEP" });
      expect(next.currentStep).toBe(4);
    });

    it("clamps at TOTAL_STEPS", () => {
      const state = freshState({ currentStep: TOTAL_STEPS });
      const next = wizardReducer(state, { type: "NEXT_STEP" });
      expect(next.currentStep).toBe(TOTAL_STEPS);
    });
  });

  // -- PREV_STEP --
  describe("PREV_STEP", () => {
    it("decrements currentStep by 1", () => {
      const state = freshState({ currentStep: 4 });
      const next = wizardReducer(state, { type: "PREV_STEP" });
      expect(next.currentStep).toBe(3);
    });

    it("clamps at 1", () => {
      const state = freshState({ currentStep: 1 });
      const next = wizardReducer(state, { type: "PREV_STEP" });
      expect(next.currentStep).toBe(1);
    });
  });

  // -- LOAD_STATE --
  describe("LOAD_STATE", () => {
    it("replaces entire state", () => {
      const customState = freshState({ cardType: "dankkarte", currentStep: 7 });
      const next = wizardReducer(freshState(), { type: "LOAD_STATE", state: customState });
      expect(next).toEqual(customState);
    });
  });

  // -- RESET --
  describe("RESET", () => {
    it("returns initialWizardState", () => {
      const modified = freshState({ cardType: "trauerkarte", currentStep: 5, templateId: "tpl-x" });
      const next = wizardReducer(modified, { type: "RESET" });
      expect(next).toEqual(initialWizardState);
    });
  });

  // -- Unknown action --
  describe("unknown action", () => {
    it("returns current state unchanged", () => {
      const state = freshState({ cardType: "sterbebild" });
      // @ts-expect-error — testing unknown action type
      const next = wizardReducer(state, { type: "UNKNOWN_ACTION" } as WizardAction);
      expect(next).toBe(state);
    });
  });

  // -- Immutability --
  describe("immutability", () => {
    it("does not mutate the original state", () => {
      const state = freshState();
      const original = structuredClone(state);
      wizardReducer(state, { type: "SET_CARD_TYPE", cardType: "sterbebild" });
      expect(state).toEqual(original);
    });
  });
});

// ─── isStepValid ─────────────────────────────────────────────────────────────

describe("isStepValid", () => {
  // Step 1: cardType + cardFormat
  it("step 1 valid when cardType and cardFormat are set", () => {
    const state = freshState({ cardType: "trauerkarte", cardFormat: "folded" });
    expect(isStepValid(state, 1)).toBe(true);
  });

  it("step 1 invalid when cardType is null", () => {
    const state = freshState({ cardType: null, cardFormat: "single" });
    expect(isStepValid(state, 1)).toBe(false);
  });

  it("step 1 invalid when cardFormat is null", () => {
    const state = freshState({ cardType: "dankkarte", cardFormat: null });
    expect(isStepValid(state, 1)).toBe(false);
  });

  it("step 1 invalid when both are null", () => {
    expect(isStepValid(freshState(), 1)).toBe(false);
  });

  // Step 2: templateId
  it("step 2 valid when templateId is set", () => {
    const state = freshState({ templateId: "tpl-123" });
    expect(isStepValid(state, 2)).toBe(true);
  });

  it("step 2 invalid when templateId is null", () => {
    expect(isStepValid(freshState(), 2)).toBe(false);
  });

  // Step 3: background
  it("step 3 valid when background type is color (always valid)", () => {
    expect(isStepValid(freshState(), 3)).toBe(true);
  });

  it("step 3 valid when background type is image with imageUrl", () => {
    const state = freshState();
    state.background = { type: "image", color: "#FFF", imageUrl: "https://bg.jpg" };
    expect(isStepValid(state, 3)).toBe(true);
  });

  it("step 3 invalid when background type is image without imageUrl", () => {
    const state = freshState();
    state.background = { type: "image", color: "#FFF", imageUrl: null };
    expect(isStepValid(state, 3)).toBe(false);
  });

  // Step 4: always valid (photo optional)
  it("step 4 always valid", () => {
    expect(isStepValid(freshState(), 4)).toBe(true);
  });

  // Step 5: name must have text
  it("step 5 valid when name has text", () => {
    const state = freshState();
    state.textContent.name = "Johann Beispiel";
    expect(isStepValid(state, 5)).toBe(true);
  });

  it("step 5 invalid when name is empty string", () => {
    expect(isStepValid(freshState(), 5)).toBe(false);
  });

  it("step 5 invalid when name is whitespace only", () => {
    const state = freshState();
    state.textContent.name = "   \t  ";
    expect(isStepValid(state, 5)).toBe(false);
  });

  // Steps 6-8: always valid
  it("step 6 always valid (decorations optional)", () => {
    expect(isStepValid(freshState(), 6)).toBe(true);
  });

  it("step 7 always valid (preview)", () => {
    expect(isStepValid(freshState(), 7)).toBe(true);
  });

  it("step 8 always valid (order)", () => {
    expect(isStepValid(freshState(), 8)).toBe(true);
  });

  // Out-of-range steps
  it("step 0 returns false (invalid step)", () => {
    expect(isStepValid(freshState(), 0)).toBe(false);
  });

  it("step 9 returns false (beyond TOTAL_STEPS)", () => {
    expect(isStepValid(freshState(), 9)).toBe(false);
  });

  it("negative step returns false", () => {
    expect(isStepValid(freshState(), -1)).toBe(false);
  });
});
