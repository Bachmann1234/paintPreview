import {
  hexToRgb,
  blendMultiply,
  blendOverlay,
  blendSoftLight,
} from "./utils.js";
import { state, els } from "./state.js";
import { scheduleAutoSave } from "./project.js";

export function applyColors(ctx) {
  const { img, originalData, maskData, intensity, blendMode, zones } = state;
  const imageData = ctx.createImageData(img.width, img.height);
  const src = originalData.data;
  const dst = imageData.data;
  const alpha = intensity / 100;
  const mode = blendMode;
  const mask = maskData;
  const len = img.width * img.height;

  const zc = zones.map((z) => {
    const [r, g, b] = hexToRgb(z.color);
    return [r / 255, g / 255, b / 255];
  });

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const zone = mask[i];
    if (zone > 0 && zone <= zc.length) {
      const [crN, cgN, cbN] = zc[zone - 1];
      const sr = src[idx] / 255,
        sg = src[idx + 1] / 255,
        sb = src[idx + 2] / 255;
      let br, bg, bb;
      if (mode === "multiply") {
        br = blendMultiply(sr, crN);
        bg = blendMultiply(sg, cgN);
        bb = blendMultiply(sb, cbN);
      } else if (mode === "overlay") {
        br = blendOverlay(sr, crN);
        bg = blendOverlay(sg, cgN);
        bb = blendOverlay(sb, cbN);
      } else {
        br = blendSoftLight(sr, crN);
        bg = blendSoftLight(sg, cgN);
        bb = blendSoftLight(sb, cbN);
      }
      dst[idx] = src[idx] + (br * 255 - src[idx]) * alpha;
      dst[idx + 1] = src[idx + 1] + (bg * 255 - src[idx + 1]) * alpha;
      dst[idx + 2] = src[idx + 2] + (bb * 255 - src[idx + 2]) * alpha;
    } else {
      dst[idx] = src[idx];
      dst[idx + 1] = src[idx + 1];
      dst[idx + 2] = src[idx + 2];
    }
    dst[idx + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

export function renderEditView(ctx) {
  const { img, originalData, maskData, intensity, zones } = state;
  const imageData = ctx.createImageData(img.width, img.height);
  const src = originalData.data;
  const dst = imageData.data;
  const mask = maskData;
  const len = img.width * img.height;
  const alpha = intensity / 100;

  const zc = zones.map((z) => {
    const [r, g, b] = hexToRgb(z.color);
    return [r / 255, g / 255, b / 255];
  });

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const zone = mask[i];
    if (zone > 0 && zone <= zones.length) {
      const [crN, cgN, cbN] = zc[zone - 1];
      const sr = src[idx] / 255,
        sg = src[idx + 1] / 255,
        sb = src[idx + 2] / 255;
      const br = sr * crN,
        bg = sg * cgN,
        bb = sb * cbN;
      const previewAlpha = alpha * 0.65;
      const r = src[idx] + (br * 255 - src[idx]) * previewAlpha;
      const g = src[idx + 1] + (bg * 255 - src[idx + 1]) * previewAlpha;
      const b = src[idx + 2] + (bb * 255 - src[idx + 2]) * previewAlpha;

      const tint = zc[zone - 1].map((c) => c * 255);
      const tintAmt = 0.12;
      dst[idx] = r * (1 - tintAmt) + tint[0] * tintAmt;
      dst[idx + 1] = g * (1 - tintAmt) + tint[1] * tintAmt;
      dst[idx + 2] = b * (1 - tintAmt) + tint[2] * tintAmt;
    } else {
      dst[idx] = src[idx] * 0.35;
      dst[idx + 1] = src[idx + 1] * 0.35;
      dst[idx + 2] = src[idx + 2] * 0.35;
    }
    dst[idx + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

let renderRAF = 0;
export function render() {
  if (renderRAF) return;
  renderRAF = requestAnimationFrame(() => {
    renderRAF = 0;
    renderNow();
    scheduleAutoSave();
  });
}

export function renderNow() {
  if (!state.originalData) return;
  const toolbar = document.getElementById("maskToolbar");

  if (state.viewMode === "edit") {
    renderEditView(els.mainCtx);
    els.compareCanvas.style.display = "none";
    document.getElementById("compareSlider").style.display = "none";
    document.getElementById("compareLabels").style.display = "none";
    toolbar.classList.add("visible");
    return;
  }

  toolbar.classList.remove("visible");

  if (state.viewMode === "compare") {
    applyColors(els.mainCtx);
    els.compareCtx.putImageData(state.originalData, 0, 0);
    els.compareCanvas.style.display = "block";
    document.getElementById("compareSlider").style.display = "block";
    document.getElementById("compareLabels").style.display = "flex";
    updateCompareClip();
  } else {
    applyColors(els.mainCtx);
    els.compareCanvas.style.display = "none";
    document.getElementById("compareSlider").style.display = "none";
    document.getElementById("compareLabels").style.display = "none";
  }
}

export function updateCompareClip() {
  const pct = state.compareSplit * 100;
  els.compareCanvas.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;

  const canvasRect = els.mainCanvas.getBoundingClientRect();
  const containerRect = els.canvasContainer.getBoundingClientRect();
  const sliderLeft =
    canvasRect.left -
    containerRect.left +
    canvasRect.width * state.compareSplit;
  document.getElementById("compareSlider").style.left = sliderLeft + "px";
}
