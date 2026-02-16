import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rlEncode,
  rlDecode,
  rlDecodeSigned,
  blendMultiply,
  blendOverlay,
  blendSoftLight,
} from "../src/utils.js";

describe("hexToRgb", () => {
  it("converts black", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });

  it("converts white", () => {
    expect(hexToRgb("#FFFFFF")).toEqual([255, 255, 255]);
  });

  it("converts pure red", () => {
    expect(hexToRgb("#FF0000")).toEqual([255, 0, 0]);
  });

  it("converts pure green", () => {
    expect(hexToRgb("#00FF00")).toEqual([0, 255, 0]);
  });

  it("converts pure blue", () => {
    expect(hexToRgb("#0000FF")).toEqual([0, 0, 255]);
  });

  it("converts a typical wall color", () => {
    expect(hexToRgb("#D1CBC1")).toEqual([209, 203, 193]);
  });

  it("handles lowercase hex", () => {
    expect(hexToRgb("#ff8800")).toEqual([255, 136, 0]);
  });
});

describe("rlEncode / rlDecode", () => {
  it("round-trips an empty array", () => {
    const input = new Uint8Array(0);
    const encoded = rlEncode(input);
    expect(encoded).toEqual([]);
    const decoded = rlDecode(encoded, 0);
    expect(decoded).toEqual(new Uint8Array(0));
  });

  it("round-trips all zeros", () => {
    const input = new Uint8Array(100);
    const encoded = rlEncode(input);
    expect(encoded).toEqual([[0, 100]]);
    const decoded = rlDecode(encoded, 100);
    expect(decoded).toEqual(input);
  });

  it("round-trips all same non-zero value", () => {
    const input = new Uint8Array(50).fill(3);
    const encoded = rlEncode(input);
    expect(encoded).toEqual([[3, 50]]);
    const decoded = rlDecode(encoded, 50);
    expect(decoded).toEqual(input);
  });

  it("round-trips alternating values", () => {
    const input = new Uint8Array([1, 2, 1, 2, 1, 2]);
    const encoded = rlEncode(input);
    expect(encoded).toEqual([
      [1, 1],
      [2, 1],
      [1, 1],
      [2, 1],
      [1, 1],
      [2, 1],
    ]);
    const decoded = rlDecode(encoded, 6);
    expect(decoded).toEqual(input);
  });

  it("round-trips a realistic mask pattern", () => {
    // Simulate: 1000 bg pixels, 500 zone 1, 200 zone 2, 300 bg
    const input = new Uint8Array(2000);
    input.fill(1, 1000, 1500);
    input.fill(2, 1500, 1700);
    const encoded = rlEncode(input);
    const decoded = rlDecode(encoded, 2000);
    expect(decoded).toEqual(input);
  });

  it("encodes runs efficiently", () => {
    const input = new Uint8Array(10000);
    const encoded = rlEncode(input);
    // Single run of 10000 zeros
    expect(encoded.length).toBe(1);
  });
});

describe("rlDecodeSigned", () => {
  it("decodes signed values", () => {
    const runs = [
      [1, 3],
      [-1, 2],
      [0, 5],
    ];
    const result = rlDecodeSigned(runs, 10);
    expect(result).toBeInstanceOf(Int8Array);
    expect(Array.from(result)).toEqual([1, 1, 1, -1, -1, 0, 0, 0, 0, 0]);
  });

  it("handles empty runs", () => {
    const result = rlDecodeSigned([], 0);
    expect(result).toEqual(new Int8Array(0));
  });
});

describe("blendMultiply", () => {
  it("returns 0 when source is 0", () => {
    expect(blendMultiply(0, 0.5)).toBe(0);
  });

  it("returns 0 when color is 0", () => {
    expect(blendMultiply(0.5, 0)).toBe(0);
  });

  it("returns source when color is 1", () => {
    expect(blendMultiply(0.7, 1)).toBeCloseTo(0.7);
  });

  it("returns color when source is 1", () => {
    expect(blendMultiply(1, 0.3)).toBeCloseTo(0.3);
  });

  it("multiplies correctly for mid values", () => {
    expect(blendMultiply(0.5, 0.5)).toBeCloseTo(0.25);
  });
});

describe("blendOverlay", () => {
  it("returns 0 when both are 0", () => {
    expect(blendOverlay(0, 0)).toBe(0);
  });

  it("returns 1 when both are 1", () => {
    expect(blendOverlay(1, 1)).toBeCloseTo(1);
  });

  it("uses multiply formula when source < 0.5", () => {
    // 2 * 0.25 * 0.5 = 0.25
    expect(blendOverlay(0.25, 0.5)).toBeCloseTo(0.25);
  });

  it("uses screen formula when source >= 0.5", () => {
    // 1 - 2 * (1 - 0.75) * (1 - 0.5) = 1 - 2 * 0.25 * 0.5 = 0.75
    expect(blendOverlay(0.75, 0.5)).toBeCloseTo(0.75);
  });

  it("at source = 0.5 boundary, matches multiply path", () => {
    // s < 0.5 is false, so screen formula: 1 - 2*(1-0.5)*(1-0.5) = 1 - 0.5 = 0.5
    expect(blendOverlay(0.5, 0.5)).toBeCloseTo(0.5);
  });
});

describe("blendSoftLight", () => {
  it("returns 0 when source is 0", () => {
    expect(blendSoftLight(0, 0.5)).toBe(0);
  });

  it("returns source when color is 0.5", () => {
    // (1 - 2*0.5) * s*s + 2*0.5*s = 0 + s = s
    expect(blendSoftLight(0.7, 0.5)).toBeCloseTo(0.7);
  });

  it("darkens when color is 0", () => {
    // (1 - 0) * s*s + 0 = s*s
    expect(blendSoftLight(0.5, 0)).toBeCloseTo(0.25);
  });

  it("lightens when color is 1", () => {
    // (1 - 2) * s*s + 2*s = -s*s + 2s
    expect(blendSoftLight(0.5, 1)).toBeCloseTo(0.75);
  });
});
