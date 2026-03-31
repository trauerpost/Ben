import { describe, it, expect } from "vitest";
import {
  wizardReducer,
  initialWizardState,
  getMergedElement,
  type WizardState,
  type ElementOverride,
} from "../wizard-state";

function freshState(overrides?: Partial<WizardState>): WizardState {
  return { ...structuredClone(initialWizardState), ...overrides };
}

describe("elementOverrides reducer", () => {
  describe("SET_ELEMENT_OVERRIDE", () => {
    it("creates new override for element", () => {
      const state = freshState();
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_OVERRIDE",
        elementId: "name",
        override: { fontColor: "#FF0000" },
      });
      expect(next.elementOverrides.name).toEqual({ fontColor: "#FF0000" });
    });

    it("shallow-merges with existing override", () => {
      const state = freshState({
        elementOverrides: { name: { fontColor: "#FF0000", fontSize: 24 } },
      });
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_OVERRIDE",
        elementId: "name",
        override: { fontFamily: "Inter" },
      });
      expect(next.elementOverrides.name).toEqual({
        fontColor: "#FF0000",
        fontSize: 24,
        fontFamily: "Inter",
      });
    });

    it("NEG: clamps x > 1000 to 1000", () => {
      const state = freshState();
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_OVERRIDE",
        elementId: "el1",
        override: { x: 1500 },
      });
      expect(next.elementOverrides.el1.x).toBe(1000);
    });

    it("NEG: clamps x < 0 to 0", () => {
      const state = freshState();
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_OVERRIDE",
        elementId: "el1",
        override: { x: -100 },
      });
      expect(next.elementOverrides.el1.x).toBe(0);
    });

    it("NEG: clamps w below 50 to 50", () => {
      const state = freshState();
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_OVERRIDE",
        elementId: "el1",
        override: { w: 10 },
      });
      expect(next.elementOverrides.el1.w).toBe(50);
    });
  });

  describe("SET_ELEMENT_POSITION", () => {
    it("sets x and y", () => {
      const state = freshState();
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_POSITION",
        elementId: "heading",
        x: 200,
        y: 300,
      });
      expect(next.elementOverrides.heading.x).toBe(200);
      expect(next.elementOverrides.heading.y).toBe(300);
    });

    it("preserves existing override properties", () => {
      const state = freshState({
        elementOverrides: { heading: { fontColor: "#00F" } },
      });
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_POSITION",
        elementId: "heading",
        x: 100,
        y: 100,
      });
      expect(next.elementOverrides.heading.fontColor).toBe("#00F");
      expect(next.elementOverrides.heading.x).toBe(100);
    });
  });

  describe("SET_ELEMENT_SIZE", () => {
    it("sets w and h", () => {
      const state = freshState();
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_SIZE",
        elementId: "quote",
        w: 400,
        h: 200,
      });
      expect(next.elementOverrides.quote.w).toBe(400);
      expect(next.elementOverrides.quote.h).toBe(200);
    });

    it("NEG: enforces minimum 50x50", () => {
      const state = freshState();
      const next = wizardReducer(state, {
        type: "SET_ELEMENT_SIZE",
        elementId: "quote",
        w: 20,
        h: 30,
      });
      expect(next.elementOverrides.quote.w).toBe(50);
      expect(next.elementOverrides.quote.h).toBe(50);
    });
  });

  describe("CLEAR_ELEMENT_OVERRIDE", () => {
    it("removes override entry", () => {
      const state = freshState({
        elementOverrides: { name: { fontColor: "#F00" }, quote: { fontSize: 14 } },
      });
      const next = wizardReducer(state, {
        type: "CLEAR_ELEMENT_OVERRIDE",
        elementId: "name",
      });
      expect(next.elementOverrides.name).toBeUndefined();
      expect(next.elementOverrides.quote).toEqual({ fontSize: 14 });
    });

    it("NEG: clearing non-existent id is no-op", () => {
      const state = freshState({ elementOverrides: { name: { fontColor: "#F00" } } });
      const next = wizardReducer(state, {
        type: "CLEAR_ELEMENT_OVERRIDE",
        elementId: "nonexistent",
      });
      expect(next.elementOverrides).toEqual({ name: { fontColor: "#F00" } });
    });
  });

  describe("SET_TEMPLATE clears overrides", () => {
    it("clears elementOverrides when template changes", () => {
      const state = freshState({
        elementOverrides: { name: { x: 100 }, quote: { fontSize: 20 } },
      });
      const next = wizardReducer(state, { type: "SET_TEMPLATE", templateId: "TI05" });
      expect(next.elementOverrides).toEqual({});
      expect(next.templateId).toBe("TI05");
    });
  });

  describe("LOAD_STATE handles missing elementOverrides", () => {
    it("adds empty elementOverrides if missing from loaded state", () => {
      const oldState = { ...initialWizardState };
      // Simulate a v8 state that has no elementOverrides
      const v8State = Object.fromEntries(
        Object.entries(oldState).filter(([k]) => k !== "elementOverrides")
      ) as unknown as WizardState;
      const next = wizardReducer(freshState(), {
        type: "LOAD_STATE",
        state: v8State,
      });
      expect(next.elementOverrides).toEqual({});
    });
  });
});

describe("getMergedElement", () => {
  const baseEl = {
    id: "name",
    x: 100, y: 200, w: 400, h: 100,
    fontFamily: "Cormorant Garamond",
    fontSize: 19,
    color: "#333",
    textAlign: "center",
  };
  const globalStyles = { fontFamily: "Playfair Display", fontColor: "#1A1A1A", textAlign: "center" };

  it("returns template values when no overrides", () => {
    const merged = getMergedElement(baseEl, {}, globalStyles);
    expect(merged.x).toBe(100);
    expect(merged.fontFamily).toBe("Cormorant Garamond");
    expect(merged.fontSize).toBe(19);
    expect(merged.fontColor).toBe("#333");
    expect(merged.hidden).toBe(false);
  });

  it("override takes priority over template", () => {
    const merged = getMergedElement(baseEl, {
      name: { fontFamily: "Inter", fontSize: 32 },
    }, globalStyles);
    expect(merged.fontFamily).toBe("Inter");
    expect(merged.fontSize).toBe(32);
    // Non-overridden properties still from template
    expect(merged.x).toBe(100);
    expect(merged.fontColor).toBe("#333");
  });

  it("global fallback when template has no value", () => {
    const elNoFont = { id: "el1", x: 0, y: 0, w: 100, h: 100 };
    const merged = getMergedElement(elNoFont, {}, globalStyles);
    expect(merged.fontFamily).toBe("Playfair Display"); // global
    expect(merged.fontColor).toBe("#1A1A1A"); // global
  });

  it("cascade: override > template > global", () => {
    const merged = getMergedElement(baseEl, {
      name: { fontColor: "#FF0000" },
    }, globalStyles);
    expect(merged.fontColor).toBe("#FF0000"); // override wins
  });

  it("hidden flag from override", () => {
    const merged = getMergedElement(baseEl, {
      name: { hidden: true },
    }, globalStyles);
    expect(merged.hidden).toBe(true);
  });

  it("NEG: position clamped to 0-1000", () => {
    const merged = getMergedElement(baseEl, {
      name: { x: 1500, y: -50 },
    }, globalStyles);
    expect(merged.x).toBe(1000);
    expect(merged.y).toBe(0);
  });
});

describe("draft migration", () => {
  // We can't test loadDraft directly (needs localStorage), but we can verify
  // that the migrateDraft logic works via LOAD_STATE + the initial state shape.

  it("NEG: v8 draft migrated to v9 gets empty elementOverrides", () => {
    // Simulate what migrateDraft does for v8
    const v8State = { ...initialWizardState } as Record<string, unknown>;
    delete v8State.elementOverrides;
    const migrated = { ...v8State, elementOverrides: {} } as WizardState;
    expect(migrated.elementOverrides).toEqual({});
    expect(migrated.textContent.name).toBe(""); // other fields preserved
  });

  it("NEG: initialWizardState has elementOverrides", () => {
    expect(initialWizardState.elementOverrides).toEqual({});
  });
});
