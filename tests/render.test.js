// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../src/project.js", () => ({
  scheduleAutoSave: vi.fn(),
}));

import { state } from "../src/state.js";
import { ZONE_TINTS } from "../src/state.js";
import { applyColors, renderEditView } from "../src/render.js";

function makeCtx() {
  return {
    createImageData(width, height) {
      return { data: new Uint8Array(width * height * 4), width, height };
    },
    putImageData: vi.fn(),
  };
}

function resetState() {
  state.img = { width: 4, height: 1 };
  // 4 pixels: RGBA
  const src = new Uint8Array(16);
  // Pixel 0: white (200,200,200)
  src[0] = 200;
  src[1] = 200;
  src[2] = 200;
  src[3] = 255;
  // Pixel 1: white (200,200,200)
  src[4] = 200;
  src[5] = 200;
  src[6] = 200;
  src[7] = 255;
  // Pixel 2: mid gray (128,128,128)
  src[8] = 128;
  src[9] = 128;
  src[10] = 128;
  src[11] = 255;
  // Pixel 3: dark (50,50,50)
  src[12] = 50;
  src[13] = 50;
  src[14] = 50;
  src[15] = 255;

  state.originalData = { data: src };
  state.maskData = new Uint8Array(4);
  state.intensity = 100;
  state.blendMode = "multiply";
  state.zones = [{ name: "Zone 1", color: "#FF0000" }];
}

beforeEach(() => {
  resetState();
  vi.clearAllMocks();
});

// ===== applyColors =====
describe("applyColors", () => {
  it("passes through unmasked pixels", () => {
    const ctx = makeCtx(4, 1);
    applyColors(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    // Pixel 0 is unmasked, should be passthrough
    expect(dst[0]).toBe(200);
    expect(dst[1]).toBe(200);
    expect(dst[2]).toBe(200);
  });

  it("applies multiply blend", () => {
    state.maskData[0] = 1; // Zone 1 = #FF0000
    state.blendMode = "multiply";
    const ctx = makeCtx(4, 1);
    applyColors(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    // R: multiply(200/255, 255/255) = 200/255 -> 200
    // G: multiply(200/255, 0) = 0
    // B: multiply(200/255, 0) = 0
    expect(dst[0]).toBeCloseTo(200, 0);
    expect(dst[1]).toBeCloseTo(0, 0);
    expect(dst[2]).toBeCloseTo(0, 0);
  });

  it("applies overlay blend", () => {
    state.maskData[0] = 1;
    state.blendMode = "overlay";
    const ctx = makeCtx(4, 1);
    applyColors(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    // s = 200/255 ≈ 0.784 (>0.5), c = 1.0
    // overlay = 1 - 2*(1-0.784)*(1-1) = 1
    expect(dst[0]).toBeCloseTo(255, 0);
  });

  it("applies softLight blend", () => {
    state.maskData[0] = 1;
    state.blendMode = "softLight";
    const ctx = makeCtx(4, 1);
    applyColors(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    // s = 200/255, c = 1.0
    // softLight = (1-2*1)*s*s + 2*1*s = -s*s + 2s
    const s = 200 / 255;
    const expected = (-s * s + 2 * s) * 255;
    expect(dst[0]).toBeCloseTo(expected, 0);
  });

  it("scales with intensity", () => {
    state.maskData[0] = 1;
    state.intensity = 50;
    state.blendMode = "multiply";
    const ctx = makeCtx(4, 1);
    applyColors(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    // At 50% intensity: src + (blended - src) * 0.5
    // R channel: 200 + (200 - 200) * 0.5 = 200
    expect(dst[0]).toBeCloseTo(200, 0);
    // G channel: 200 + (0 - 200) * 0.5 = 100
    expect(dst[1]).toBeCloseTo(100, 0);
  });

  it("sets alpha to 255", () => {
    state.maskData[0] = 1;
    const ctx = makeCtx(4, 1);
    applyColors(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    expect(dst[3]).toBe(255);
    expect(dst[7]).toBe(255);
  });
});

// ===== renderEditView =====
describe("renderEditView", () => {
  it("darkens unmasked pixels to ~35%", () => {
    const ctx = makeCtx(4, 1);
    renderEditView(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    // Pixel 0 is unmasked
    expect(dst[0]).toBeCloseTo(200 * 0.35, 1);
    expect(dst[1]).toBeCloseTo(200 * 0.35, 1);
    expect(dst[2]).toBeCloseTo(200 * 0.35, 1);
  });

  it("applies tinted preview to masked pixels", () => {
    state.maskData[0] = 1; // Zone 1
    state.intensity = 100;
    const ctx = makeCtx(4, 1);
    renderEditView(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    // Masked pixel should be blended, not darkened to 35%
    // It should be notably different from 200*0.35=70
    expect(dst[0]).not.toBeCloseTo(200 * 0.35, 0);
  });

  it("uses correct zone tint colors", () => {
    state.maskData[0] = 1;
    state.intensity = 100;
    const ctx = makeCtx(4, 1);
    renderEditView(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;

    // The tint is applied at 12%
    const tint = ZONE_TINTS[0];
    const tintAmt = 0.12;
    // The base is multiply-blended then mixed
    const s = 200 / 255;
    const cR = 255 / 255; // Zone color #FF0000
    const blendedR = s * cR; // multiply
    const previewAlpha = 1.0 * 0.65;
    const rBase = 200 + (blendedR * 255 - 200) * previewAlpha;
    const expectedR = rBase * (1 - tintAmt) + tint[0] * tintAmt;
    expect(dst[0]).toBeCloseTo(expectedR, 0);
  });

  it("sets alpha to 255 for all pixels", () => {
    state.maskData[0] = 1;
    const ctx = makeCtx(4, 1);
    renderEditView(ctx);
    const dst = ctx.putImageData.mock.calls[0][0].data;
    for (let i = 0; i < 4; i++) {
      expect(dst[i * 4 + 3]).toBe(255);
    }
  });
});
