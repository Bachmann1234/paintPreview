// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../src/render.js", () => ({
  render: vi.fn(),
}));

import { state, els, MAX_UNDO } from "../src/state.js";
import {
  beginStroke,
  endStroke,
  undo,
  redo,
  updateUndoButtons,
  getImageCoords,
  getImageBrushRadius,
  paintAt,
  paintLine,
  floodFill,
  autoDetectWalls,
} from "../src/masks.js";

function resetState() {
  state.img = { width: 10, height: 10 };
  state.maskData = new Uint8Array(100);
  state.originalData = { data: new Uint8Array(400) };
  state.undoStack = [];
  state.redoStack = [];
  state.currentDiff = null;
  state.activeZone = 0;
  state.activeTool = "brush";
  state.brushSize = 3;
  state.brushShape = "round";
  state.fillTolerance = 32;
  state.zones = [
    { name: "Zone 1", color: "#D1CBC1" },
    { name: "Zone 2", color: "#CDD2CA" },
  ];
}

beforeEach(() => {
  resetState();

  // Minimal DOM for undo/redo buttons
  document.body.innerHTML = `
    <button id="undoBtn"></button>
    <button id="redoBtn"></button>
  `;

  // Mock mainCanvas bounding rect for 1:1 mapping
  els.mainCanvas = {
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 10,
      height: 10,
    }),
  };

  vi.clearAllMocks();
});

// ===== beginStroke =====
describe("beginStroke", () => {
  it("creates a new Map for currentDiff", () => {
    beginStroke();
    expect(state.currentDiff).toBeInstanceOf(Map);
    expect(state.currentDiff.size).toBe(0);
  });

  it("clears redoStack", () => {
    state.redoStack = [new Map([[0, 1]])];
    beginStroke();
    expect(state.redoStack).toEqual([]);
  });

  it("replaces any existing currentDiff", () => {
    state.currentDiff = new Map([[5, 0]]);
    beginStroke();
    expect(state.currentDiff.size).toBe(0);
  });
});

// ===== endStroke =====
describe("endStroke", () => {
  it("pushes currentDiff to undoStack when non-empty", () => {
    beginStroke();
    state.currentDiff.set(0, 0);
    endStroke();
    expect(state.undoStack.length).toBe(1);
    expect(state.undoStack[0].get(0)).toBe(0);
  });

  it("sets currentDiff to null", () => {
    beginStroke();
    endStroke();
    expect(state.currentDiff).toBeNull();
  });

  it("skips empty diffs", () => {
    beginStroke();
    endStroke();
    expect(state.undoStack.length).toBe(0);
  });

  it("respects MAX_UNDO limit", () => {
    for (let i = 0; i < MAX_UNDO + 5; i++) {
      beginStroke();
      state.currentDiff.set(0, i);
      endStroke();
    }
    expect(state.undoStack.length).toBe(MAX_UNDO);
  });
});

// ===== undo / redo =====
describe("undo", () => {
  it("reverts mask pixels to previous values", () => {
    state.maskData[5] = 0;
    beginStroke();
    state.currentDiff.set(5, 0);
    state.maskData[5] = 1;
    endStroke();

    undo();
    expect(state.maskData[5]).toBe(0);
  });

  it("pushes reverted diff to redoStack", () => {
    beginStroke();
    state.currentDiff.set(0, 0);
    state.maskData[0] = 1;
    endStroke();

    undo();
    expect(state.redoStack.length).toBe(1);
  });

  it("removes entry from undoStack", () => {
    beginStroke();
    state.currentDiff.set(0, 0);
    endStroke();

    undo();
    expect(state.undoStack.length).toBe(0);
  });

  it("no-ops when undoStack is empty", () => {
    const before = new Uint8Array(state.maskData);
    undo();
    expect(state.maskData).toEqual(before);
    expect(state.redoStack.length).toBe(0);
  });
});

describe("redo", () => {
  it("restores mask pixels from redoStack", () => {
    state.maskData[5] = 0;
    beginStroke();
    state.currentDiff.set(5, 0);
    state.maskData[5] = 1;
    endStroke();

    undo();
    expect(state.maskData[5]).toBe(0);
    redo();
    expect(state.maskData[5]).toBe(1);
  });

  it("pushes to undoStack after redo", () => {
    beginStroke();
    state.currentDiff.set(0, 0);
    state.maskData[0] = 1;
    endStroke();

    undo();
    redo();
    expect(state.undoStack.length).toBe(1);
  });

  it("removes entry from redoStack", () => {
    beginStroke();
    state.currentDiff.set(0, 0);
    endStroke();

    undo();
    redo();
    expect(state.redoStack.length).toBe(0);
  });

  it("no-ops when redoStack is empty", () => {
    const before = new Uint8Array(state.maskData);
    redo();
    expect(state.maskData).toEqual(before);
    expect(state.undoStack.length).toBe(0);
  });
});

// ===== updateUndoButtons =====
describe("updateUndoButtons", () => {
  it("disables buttons when stacks are empty", () => {
    updateUndoButtons();
    expect(document.getElementById("undoBtn").disabled).toBe(true);
    expect(document.getElementById("redoBtn").disabled).toBe(true);
  });

  it("enables buttons when stacks have entries", () => {
    state.undoStack.push(new Map());
    state.redoStack.push(new Map());
    updateUndoButtons();
    expect(document.getElementById("undoBtn").disabled).toBe(false);
    expect(document.getElementById("redoBtn").disabled).toBe(false);
  });
});

// ===== getImageCoords =====
describe("getImageCoords", () => {
  it("returns correct coords at 1:1 scale", () => {
    const { x, y } = getImageCoords(5, 3);
    expect(x).toBeCloseTo(5);
    expect(y).toBeCloseTo(3);
  });

  it("accounts for rect offset", () => {
    els.mainCanvas.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      width: 10,
      height: 10,
    });
    const { x, y } = getImageCoords(15, 25);
    expect(x).toBeCloseTo(5);
    expect(y).toBeCloseTo(5);
  });
});

// ===== getImageBrushRadius =====
describe("getImageBrushRadius", () => {
  it("returns brushSize at 1:1 scale", () => {
    state.brushSize = 5;
    expect(getImageBrushRadius()).toBeCloseTo(5);
  });

  it("scales when display size differs from image", () => {
    state.brushSize = 5;
    els.mainCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 5,
      height: 5,
    });
    // img is 10x10, display is 5x5, so scale = 2
    expect(getImageBrushRadius()).toBeCloseTo(10);
  });
});

// ===== paintAt =====
describe("paintAt", () => {
  it("paints round brush shape", () => {
    state.brushSize = 1;
    state.brushShape = "round";
    beginStroke();
    paintAt(5, 5);
    // Center pixel should be painted
    expect(state.maskData[5 * 10 + 5]).toBe(1);
  });

  it("paints square brush shape", () => {
    state.brushSize = 1;
    state.brushShape = "square";
    beginStroke();
    paintAt(5, 5);
    // Center and adjacent pixels within square
    expect(state.maskData[5 * 10 + 5]).toBe(1);
    // Corners of a 1px radius square should be filled
    expect(state.maskData[4 * 10 + 4]).toBe(1);
    expect(state.maskData[4 * 10 + 6]).toBe(1);
    expect(state.maskData[6 * 10 + 4]).toBe(1);
    expect(state.maskData[6 * 10 + 6]).toBe(1);
  });

  it("erases when activeTool is erase", () => {
    state.maskData[55] = 1;
    state.activeTool = "erase";
    state.brushSize = 0.5;
    beginStroke();
    paintAt(5, 5);
    expect(state.maskData[55]).toBe(0);
  });

  it("writes correct zone value", () => {
    state.activeZone = 1;
    state.brushSize = 0.5;
    beginStroke();
    paintAt(5, 5);
    expect(state.maskData[55]).toBe(2); // activeZone + 1
  });

  it("clamps to image bounds", () => {
    state.brushSize = 5;
    beginStroke();
    // Paint at corner — should not throw
    paintAt(0, 0);
    paintAt(9, 9);
    // No out-of-bounds access
    expect(state.maskData.length).toBe(100);
  });

  it("records diff for undo", () => {
    state.brushSize = 0.5;
    beginStroke();
    paintAt(5, 5);
    expect(state.currentDiff.size).toBeGreaterThan(0);
  });

  it("records only first old value per pixel", () => {
    state.brushSize = 0.5;
    state.maskData[55] = 3;
    beginStroke();
    paintAt(5, 5);
    expect(state.currentDiff.get(55)).toBe(3);
    // Paint again — should keep original old value
    state.maskData[55] = 7;
    paintAt(5, 5);
    expect(state.currentDiff.get(55)).toBe(3);
  });
});

// ===== paintLine =====
describe("paintLine", () => {
  it("paints pixels along a horizontal line", () => {
    state.brushSize = 0.5;
    beginStroke();
    paintLine(0, 5, 9, 5);
    // Pixels along row 5 should be painted
    let painted = 0;
    for (let x = 0; x < 10; x++) {
      if (state.maskData[5 * 10 + x] > 0) painted++;
    }
    expect(painted).toBeGreaterThanOrEqual(8);
  });

  it("paints pixels along a vertical line", () => {
    state.brushSize = 0.5;
    beginStroke();
    paintLine(5, 0, 5, 9);
    let painted = 0;
    for (let y = 0; y < 10; y++) {
      if (state.maskData[y * 10 + 5] > 0) painted++;
    }
    expect(painted).toBeGreaterThanOrEqual(8);
  });

  it("paints pixels along a diagonal line", () => {
    state.brushSize = 0.5;
    beginStroke();
    paintLine(0, 0, 9, 9);
    let painted = 0;
    for (let i = 0; i < 10; i++) {
      if (state.maskData[i * 10 + i] > 0) painted++;
    }
    expect(painted).toBeGreaterThanOrEqual(7);
  });
});

// ===== floodFill =====
describe("floodFill", () => {
  beforeEach(() => {
    // Set up a uniform white image (all 255)
    const src = new Uint8Array(400);
    for (let i = 0; i < 400; i += 4) {
      src[i] = 255;
      src[i + 1] = 255;
      src[i + 2] = 255;
      src[i + 3] = 255;
    }
    state.originalData = { data: src };
  });

  it("fills a uniform region", () => {
    floodFill(5, 5);
    // Entire image should be filled since it's all the same color
    let filled = 0;
    for (let i = 0; i < 100; i++) {
      if (state.maskData[i] > 0) filled++;
    }
    expect(filled).toBe(100);
  });

  it("stops at color boundary", () => {
    // Make right half black
    const src = state.originalData.data;
    for (let y = 0; y < 10; y++) {
      for (let x = 5; x < 10; x++) {
        const idx = (y * 10 + x) * 4;
        src[idx] = 0;
        src[idx + 1] = 0;
        src[idx + 2] = 0;
      }
    }
    state.fillTolerance = 10; // Low tolerance

    floodFill(2, 5); // Fill in white region
    // Only left half should be filled
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 5; x++) {
        expect(state.maskData[y * 10 + x]).toBe(1);
      }
      for (let x = 5; x < 10; x++) {
        expect(state.maskData[y * 10 + x]).toBe(0);
      }
    }
  });

  it("respects tolerance", () => {
    // Make one pixel slightly different
    const src = state.originalData.data;
    src[0] = 250; // R slightly off at pixel (0,0)
    state.fillTolerance = 10; // Should still fill

    floodFill(5, 5);
    expect(state.maskData[0]).toBe(1); // close enough to fill
  });

  it("skips already-filled pixels (same zone)", () => {
    state.maskData.fill(1); // All already zone 1
    state.activeZone = 0; // val = 1
    floodFill(5, 5);
    // Should exit early — undoStack should be empty since nothing changed
    expect(state.undoStack.length).toBe(0);
  });

  it("does nothing for out-of-bounds start", () => {
    floodFill(-1, 5);
    floodFill(5, -1);
    floodFill(10, 5);
    floodFill(5, 10);
    let filled = 0;
    for (let i = 0; i < 100; i++) {
      if (state.maskData[i] > 0) filled++;
    }
    expect(filled).toBe(0);
  });

  it("records undo entry", () => {
    floodFill(5, 5);
    expect(state.undoStack.length).toBe(1);
    expect(state.undoStack[0].size).toBe(100);
  });
});

// ===== autoDetectWalls =====
describe("autoDetectWalls", () => {
  beforeEach(() => {
    state.maskData = new Uint8Array(100);
  });

  it("marks light, low-saturation pixels", () => {
    const src = new Uint8Array(400);
    // Fill all pixels with light gray (200,200,200)
    for (let i = 0; i < 400; i += 4) {
      src[i] = 200;
      src[i + 1] = 200;
      src[i + 2] = 200;
      src[i + 3] = 255;
    }
    state.originalData = { data: src };

    autoDetectWalls(0);
    let masked = 0;
    for (let i = 0; i < 100; i++) {
      if (state.maskData[i] > 0) masked++;
    }
    expect(masked).toBe(100);
  });

  it("skips dark pixels", () => {
    const src = new Uint8Array(400);
    // Dark pixels (30,30,30)
    for (let i = 0; i < 400; i += 4) {
      src[i] = 30;
      src[i + 1] = 30;
      src[i + 2] = 30;
      src[i + 3] = 255;
    }
    state.originalData = { data: src };

    autoDetectWalls(0);
    let masked = 0;
    for (let i = 0; i < 100; i++) {
      if (state.maskData[i] > 0) masked++;
    }
    expect(masked).toBe(0);
  });

  it("skips green pixels", () => {
    const src = new Uint8Array(400);
    // Green pixels
    for (let i = 0; i < 400; i += 4) {
      src[i] = 60;
      src[i + 1] = 180;
      src[i + 2] = 60;
      src[i + 3] = 255;
    }
    state.originalData = { data: src };

    autoDetectWalls(0);
    let masked = 0;
    for (let i = 0; i < 100; i++) {
      if (state.maskData[i] > 0) masked++;
    }
    expect(masked).toBe(0);
  });

  it("skips already-masked pixels", () => {
    const src = new Uint8Array(400);
    for (let i = 0; i < 400; i += 4) {
      src[i] = 200;
      src[i + 1] = 200;
      src[i + 2] = 200;
      src[i + 3] = 255;
    }
    state.originalData = { data: src };
    state.maskData[0] = 2; // Already assigned to another zone

    autoDetectWalls(0);
    expect(state.maskData[0]).toBe(2); // Should remain unchanged
    expect(state.maskData[1]).toBe(1); // Others should be detected
  });

  it("assigns the correct zone value", () => {
    const src = new Uint8Array(400);
    for (let i = 0; i < 400; i += 4) {
      src[i] = 220;
      src[i + 1] = 220;
      src[i + 2] = 220;
      src[i + 3] = 255;
    }
    state.originalData = { data: src };

    autoDetectWalls(1); // target zone 1 -> val = 2
    expect(state.maskData[0]).toBe(2);
  });
});
