import {
  hexToRgb,
  rlEncode,
  rlDecode,
  rlDecodeSigned,
  blendMultiply,
  blendOverlay,
  blendSoftLight,
} from "./utils.js";

const PRESETS = [
  { name: "Extra White SW 7006", hex: "#EEEFEA" },
  { name: "Pure White SW 7005", hex: "#EDECE6" },
  { name: "Snowbound SW 7004", hex: "#EDEAE5" },
  { name: "Alabaster SW 7008", hex: "#EDEAE0" },
  { name: "Greek Villa SW 7551", hex: "#F0ECE2" },
  { name: "Dover White SW 6385", hex: "#F0EADB" },
  { name: "Shoji White SW 7042", hex: "#E6DFD3" },
  { name: "Incredible White SW 7028", hex: "#E3DED6" },
  { name: "Eider White SW 7014", hex: "#E2DED8" },
  { name: "City Loft SW 7631", hex: "#DFDAD1" },
  { name: "Creamy SW 7012", hex: "#EDE2D0" },
  { name: "Natural Choice SW 7011", hex: "#E4DDD1" },
  { name: "Accessible Beige SW 7036", hex: "#D1C7B8" },
  { name: "Agreeable Gray SW 7029", hex: "#D1CBC1" },
  { name: "Worldly Gray SW 7043", hex: "#CEC6BB" },
  { name: "Colonnade Gray SW 7641", hex: "#C6C0B6" },
  { name: "Balanced Beige SW 7037", hex: "#C1B7A7" },
  { name: "Universal Khaki SW 6150", hex: "#B8A992" },
  { name: "Mega Greige SW 7031", hex: "#C1B8AA" },
  { name: "Kilim Beige SW 6106", hex: "#C7B9A2" },
  { name: "Repose Gray SW 7015", hex: "#CCC9C0" },
  { name: "Mindful Gray SW 7016", hex: "#BCB7AD" },
  { name: "Dorian Gray SW 7017", hex: "#ACA79E" },
  { name: "Passive SW 7064", hex: "#CBCCC9" },
  { name: "Popular Gray SW 6071", hex: "#D4CCC3" },
  { name: "Functional Gray SW 7024", hex: "#ADA99E" },
  { name: "Sea Salt SW 6204", hex: "#CDD2CA" },
  { name: "Evergreen Fog SW 9130", hex: "#95978A" },
  { name: "Silvermist SW 7621", hex: "#B0B8B2" },
  { name: "Softened Green SW 6177", hex: "#BCC2B2" },
  { name: "Clary Sage SW 6178", hex: "#A3A893" },
  { name: "Svelte Sage SW 6164", hex: "#A3A08C" },
  { name: "Sleepy Blue SW 6225", hex: "#BDD0D4" },
  { name: "Krypton SW 6247", hex: "#B5C6CA" },
  { name: "Topsail SW 6217", hex: "#C9DCD6" },
  { name: "Rainwashed SW 6211", hex: "#C5D6CC" },
  { name: "Naval SW 6244", hex: "#2F3D4C" },
  { name: "Peppercorn SW 7674", hex: "#59595A" },
  { name: "Urbane Bronze SW 7048", hex: "#54504A" },
  { name: "Iron Ore SW 7069", hex: "#434341" },
  { name: "Tricorn Black SW 6258", hex: "#2C2B2C" },
  { name: "Gauntlet Gray SW 7019", hex: "#8E8983" },
];

// Zone overlay colors for edit view (hue tints)
const ZONE_TINTS = [
  [60, 190, 220], // teal
  [220, 150, 50], // amber
  [180, 80, 220], // purple
  [80, 210, 120], // green
  [220, 80, 120], // pink
  [80, 160, 220], // blue
];

const MAX_UNDO = 50;

// ===== STATE =====
let img = null;
let imageDataUrl = null; // stored data URL of the loaded image
let originalData = null;
let maskData = null; // Uint8Array: 0=bg, 1=zone1, 2=zone2, ...

let zones = [
  { name: "Zone 1", color: "#D1CBC1" },
  { name: "Zone 2", color: "#CDD2CA" },
];
let activeZone = 0;

let intensity = 75;
let blendMode = "multiply";
let viewMode = "edit";
let activeTool = "brush";
let brushSize = 40;
let brushShape = "round"; // 'round' or 'square'
let fillTolerance = 32;

// Undo / redo
let undoStack = [];
let redoStack = [];
let currentDiff = null;

// Zoom / pan
let zoomScale = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartPanX = 0;
let panStartPanY = 0;
let spaceHeld = false;

// Painting
let isPainting = false;
let lastPaintX = -1;
let lastPaintY = -1;

// Line tool
let lineStartImg = null; // {x, y} in image coords, null if no start set

// Compare
let compareSplit = 0.5;
let draggingSlider = false;

// Pinch zoom
let lastPinchDist = 0;
let lastPinchCenter = null;
let wasPinching = false;

// Elements
const mainCanvas = document.getElementById("mainCanvas");
const compareCanvas = document.getElementById("compareCanvas");
const mainCtx = mainCanvas.getContext("2d", { willReadFrequently: true });
const compareCtx = compareCanvas.getContext("2d", { willReadFrequently: true });
const canvasWrapper = document.getElementById("canvasWrapper");
const canvasContainer = document.getElementById("canvasContainer");
const startScreenEl = document.getElementById("startScreen");
const tooltipEl = document.getElementById("tooltip");
const brushCursor = document.getElementById("brushCursor");
const hintOverlay = document.getElementById("hintOverlay");

// ===== INIT =====
function init() {
  renderZoneList();
  renderPresets();
  setupEvents();
  setupStartScreen();
}

function setupImageFromDataUrl(dataUrl) {
  imageDataUrl = dataUrl;
  img = new Image();
  img.onload = () => {
    mainCanvas.width = img.width;
    mainCanvas.height = img.height;
    compareCanvas.width = img.width;
    compareCanvas.height = img.height;

    mainCtx.drawImage(img, 0, 0);
    originalData = mainCtx.getImageData(0, 0, img.width, img.height);

    maskData = new Uint8Array(img.width * img.height);

    // Try loading saved mask
    loadSavedMask();

    // Reset undo/redo for new image
    undoStack = [];
    redoStack = [];
    updateUndoButtons();

    resetZoom();
    render();
    startScreenEl.classList.add("hidden");

    // Show hint if mask is empty
    if (!maskData.some((v) => v > 0)) {
      showHint("Paint wall areas with the brush, then switch to Preview");
    }
  };
  img.src = dataUrl;
}

function loadImageFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => setupImageFromDataUrl(reader.result);
  reader.readAsDataURL(file);
}

function openFilePicker(accept, callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
  document.body.appendChild(input);
  input.addEventListener("change", () => {
    const file = input.files[0];
    document.body.removeChild(input);
    if (file) callback(file);
  });
  input.click();
}

function setupStartScreen() {
  document.getElementById("startLoadImage").addEventListener("click", () => {
    openFilePicker("image/*", loadImageFromFile);
  });

  document.getElementById("startOpenProject").addEventListener("click", () => {
    openFilePicker(".json", (file) => handleProjectOrMaskFile(file));
  });

  // Drag-and-drop
  const dropZone = document.getElementById("startDrop");
  startScreenEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  startScreenEl.addEventListener("dragleave", (e) => {
    if (!startScreenEl.contains(e.relatedTarget)) {
      dropZone.classList.remove("dragover");
    }
  });
  startScreenEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.endsWith(".json")) {
      handleProjectOrMaskFile(file);
    } else if (file.type.startsWith("image/")) {
      loadImageFromFile(file);
    }
  });
}

function handleProjectOrMaskFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.version === 3 && data.image) {
        // v3 bundled project — load embedded image, then apply mask
        loadProjectV3(data);
      } else if (data.version === 2) {
        // v2 mask-only — needs an image already loaded
        if (!img) {
          alert("Load an image first before importing a v2 mask file.");
          return;
        }
        applyImportedMask(data);
      } else {
        alert("Unrecognized project file format.");
      }
    } catch {
      alert("Invalid project file.");
    }
  };
  reader.readAsText(file);
}

function loadProjectV3(data) {
  const tempImg = new Image();
  tempImg.onload = () => {
    imageDataUrl = data.image;
    img = tempImg;

    mainCanvas.width = img.width;
    mainCanvas.height = img.height;
    compareCanvas.width = img.width;
    compareCanvas.height = img.height;

    mainCtx.drawImage(img, 0, 0);
    originalData = mainCtx.getImageData(0, 0, img.width, img.height);

    maskData = rlDecode(data.mask, img.width * img.height);
    if (data.zones) {
      zones = data.zones;
      activeZone = 0;
      renderZoneList();
    }

    undoStack = [];
    redoStack = [];
    updateUndoButtons();

    resetZoom();
    render();
    startScreenEl.classList.add("hidden");
  };
  tempImg.src = data.image;
}

// ===== RENDERING =====
function applyColors(ctx) {
  const imageData = ctx.createImageData(img.width, img.height);
  const src = originalData.data;
  const dst = imageData.data;
  const alpha = intensity / 100;
  const mode = blendMode;
  const mask = maskData;
  const len = img.width * img.height;

  // Pre-compute normalized zone colors
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

function renderEditView(ctx) {
  const imageData = ctx.createImageData(img.width, img.height);
  const src = originalData.data;
  const dst = imageData.data;
  const mask = maskData;
  const len = img.width * img.height;
  const alpha = intensity / 100;

  // Pre-compute zone colors for preview tint
  const zc = zones.map((z) => {
    const [r, g, b] = hexToRgb(z.color);
    return [r / 255, g / 255, b / 255];
  });

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const zone = mask[i];
    if (zone > 0 && zone <= zones.length) {
      // Show actual color preview at reduced opacity
      const [crN, cgN, cbN] = zc[zone - 1];
      const sr = src[idx] / 255,
        sg = src[idx + 1] / 255,
        sb = src[idx + 2] / 255;
      // Multiply blend
      const br = sr * crN,
        bg = sg * cgN,
        bb = sb * cbN;
      const previewAlpha = alpha * 0.65;
      const r = src[idx] + (br * 255 - src[idx]) * previewAlpha;
      const g = src[idx + 1] + (bg * 255 - src[idx + 1]) * previewAlpha;
      const b = src[idx + 2] + (bb * 255 - src[idx + 2]) * previewAlpha;

      // Add subtle zone tint border
      const tint = ZONE_TINTS[(zone - 1) % ZONE_TINTS.length];
      const tintAmt = 0.12;
      dst[idx] = r * (1 - tintAmt) + tint[0] * tintAmt;
      dst[idx + 1] = g * (1 - tintAmt) + tint[1] * tintAmt;
      dst[idx + 2] = b * (1 - tintAmt) + tint[2] * tintAmt;
    } else {
      // Dim non-wall areas
      dst[idx] = src[idx] * 0.35;
      dst[idx + 1] = src[idx + 1] * 0.35;
      dst[idx + 2] = src[idx + 2] * 0.35;
    }
    dst[idx + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

let renderRAF = 0;
function render() {
  if (renderRAF) return;
  renderRAF = requestAnimationFrame(() => {
    renderRAF = 0;
    renderNow();
  });
}

function renderNow() {
  if (!originalData) return;
  const toolbar = document.getElementById("maskToolbar");

  if (viewMode === "edit") {
    renderEditView(mainCtx);
    compareCanvas.style.display = "none";
    document.getElementById("compareSlider").style.display = "none";
    document.getElementById("compareLabels").style.display = "none";
    toolbar.classList.add("visible");
    return;
  }

  toolbar.classList.remove("visible");

  if (viewMode === "compare") {
    applyColors(mainCtx);
    // compareCanvas shows original
    compareCtx.putImageData(originalData, 0, 0);
    compareCanvas.style.display = "block";
    document.getElementById("compareSlider").style.display = "block";
    document.getElementById("compareLabels").style.display = "flex";
    updateCompareClip();
  } else {
    // Preview
    applyColors(mainCtx);
    compareCanvas.style.display = "none";
    document.getElementById("compareSlider").style.display = "none";
    document.getElementById("compareLabels").style.display = "none";
  }
}

function updateCompareClip() {
  // Clip the compare canvas (original) to the left portion
  const pct = compareSplit * 100;
  compareCanvas.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;

  // Position slider relative to the canvas's screen position
  const canvasRect = mainCanvas.getBoundingClientRect();
  const containerRect = canvasContainer.getBoundingClientRect();
  const sliderLeft =
    canvasRect.left - containerRect.left + canvasRect.width * compareSplit;
  document.getElementById("compareSlider").style.left = sliderLeft + "px";
}

// ===== MASK OPERATIONS =====
function beginStroke() {
  currentDiff = new Map();
  redoStack = [];
}

function endStroke() {
  if (currentDiff && currentDiff.size > 0) {
    undoStack.push(currentDiff);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }
  currentDiff = null;
  updateUndoButtons();
}

function recordPixel(i, oldVal) {
  if (currentDiff && !currentDiff.has(i)) {
    currentDiff.set(i, oldVal);
  }
}

function undo() {
  if (undoStack.length === 0) return;
  const diff = undoStack.pop();
  const redo = new Map();
  for (const [i, oldVal] of diff) {
    redo.set(i, maskData[i]);
    maskData[i] = oldVal;
  }
  redoStack.push(redo);
  updateUndoButtons();
  render();
}

function redo() {
  if (redoStack.length === 0) return;
  const diff = redoStack.pop();
  const und = new Map();
  for (const [i, oldVal] of diff) {
    und.set(i, maskData[i]);
    maskData[i] = oldVal;
  }
  undoStack.push(und);
  updateUndoButtons();
  render();
}

function updateUndoButtons() {
  document.getElementById("undoBtn").disabled = undoStack.length === 0;
  document.getElementById("redoBtn").disabled = redoStack.length === 0;
}

function getImageCoords(clientX, clientY) {
  const rect = mainCanvas.getBoundingClientRect();
  const scaleX = img.width / rect.width;
  const scaleY = img.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function getImageBrushRadius() {
  const rect = mainCanvas.getBoundingClientRect();
  return brushSize * (img.width / rect.width);
}

function paintAt(cx, cy) {
  const w = img.width,
    h = img.height;
  const r = getImageBrushRadius();
  const val = activeTool === "erase" ? 0 : activeZone + 1;

  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  const isRound = brushShape === "round";
  const r2 = r * r;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (isRound) {
        const dx = x - cx,
          dy = y - cy;
        if (dx * dx + dy * dy > r2) continue;
      }
      const i = y * w + x;
      recordPixel(i, maskData[i]);
      maskData[i] = val;
    }
  }
}

function paintLine(x0, y0, x1, y1) {
  const dx = x1 - x0,
    dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const step = Math.max(1, getImageBrushRadius() * 0.3);
  const steps = Math.ceil(dist / step);
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    paintAt(x0 + dx * t, y0 + dy * t);
  }
  render();
}

function floodFill(startX, startY) {
  const w = img.width,
    h = img.height;
  const sx = Math.round(startX),
    sy = Math.round(startY);
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const src = originalData.data;
  const startI = sy * w + sx;
  const startIdx = startI * 4;
  const sr = src[startIdx],
    sg = src[startIdx + 1],
    sb = src[startIdx + 2];
  const tol2 = fillTolerance * fillTolerance * 3;
  const val = activeZone + 1;

  if (maskData[startI] === val) return;

  const visited = new Uint8Array(w * h);
  const queue = [startI];
  let qi = 0;
  visited[startI] = 1;

  beginStroke();

  while (qi < queue.length) {
    const i = queue[qi++];
    recordPixel(i, maskData[i]);
    maskData[i] = val;

    const x = i % w,
      y = (i / w) | 0;

    if (x > 0 && !visited[i - 1]) {
      visited[i - 1] = 1;
      const ni = (i - 1) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i - 1);
    }
    if (x < w - 1 && !visited[i + 1]) {
      visited[i + 1] = 1;
      const ni = (i + 1) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i + 1);
    }
    if (y > 0 && !visited[i - w]) {
      visited[i - w] = 1;
      const ni = (i - w) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i - w);
    }
    if (y < h - 1 && !visited[i + w]) {
      visited[i + w] = 1;
      const ni = (i + w) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i + w);
    }
  }

  endStroke();
  render();
}

function autoDetectWalls(targetZone) {
  const src = originalData.data;
  const w = img.width,
    h = img.height;
  const val = targetZone + 1;
  const len = w * h;

  beginStroke();

  for (let i = 0; i < len; i++) {
    if (maskData[i] !== 0) continue; // don't overwrite existing zones
    const idx = i * 4;
    const r = src[idx],
      g = src[idx + 1],
      b = src[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const sat = max === 0 ? 0 : (max - min) / max;
    const isGreen = g > r * 1.15 && g > b * 1.15 && g > 80;
    const isWood = r > 100 && r > b * 1.4 && lightness < 150 && lightness > 40;
    const isDark = lightness < 60;

    if (lightness > 150 && sat < 0.25 && !isGreen && !isWood && !isDark) {
      recordPixel(i, maskData[i]);
      maskData[i] = val;
    }
  }

  endStroke();
  render();
}

// ===== ZOOM / PAN =====
function updateCanvasTransform() {
  canvasWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  document.getElementById("zoomDisplay").textContent =
    Math.round(zoomScale * 100) + "%";
}

function resetZoom() {
  if (!img) return;
  const cRect = canvasContainer.getBoundingClientRect();
  const scaleX = cRect.width / img.width;
  const scaleY = cRect.height / img.height;
  zoomScale = Math.min(scaleX, scaleY, 1);

  const displayW = img.width * zoomScale;
  const displayH = img.height * zoomScale;
  panX = (cRect.width - displayW) / 2;
  panY = (cRect.height - displayH) / 2;

  updateCanvasTransform();
}

function zoomAtPoint(factor, cx, cy) {
  const newScale = Math.max(0.1, Math.min(15, zoomScale * factor));
  const ratio = newScale / zoomScale;
  panX = cx - (cx - panX) * ratio;
  panY = cy - (cy - panY) * ratio;
  zoomScale = newScale;
  updateCanvasTransform();
}

// ===== SAVE / LOAD =====
function getMaskPayload() {
  return {
    version: 2,
    width: img.width,
    height: img.height,
    zones: zones,
    mask: rlEncode(maskData),
  };
}

function saveMask() {
  if (!img) return;
  localStorage.setItem("wallMaskData", JSON.stringify(getMaskPayload()));
  const btn = document.getElementById("saveMask");
  btn.textContent = "Saved!";
  setTimeout(() => {
    btn.textContent = "Save";
  }, 1500);
}

function getProjectPayload() {
  return {
    version: 3,
    width: img.width,
    height: img.height,
    zones: zones,
    mask: rlEncode(maskData),
    image: imageDataUrl,
  };
}

function exportMask() {
  if (!img) return;
  const json = JSON.stringify(getProjectPayload());
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wall-project.json";
  a.click();
  URL.revokeObjectURL(url);
  const btn = document.getElementById("exportMask");
  btn.textContent = "Done!";
  setTimeout(() => {
    btn.textContent = "Export";
  }, 1500);
}

function applyImportedMask(data) {
  if (data.width !== img.width || data.height !== img.height) {
    alert("Mask dimensions do not match current image.");
    return;
  }
  if (data.version === 2 || data.version === 3) {
    maskData = rlDecode(data.mask, img.width * img.height);
    if (data.zones) {
      zones = data.zones;
      activeZone = 0;
      renderZoneList();
    }
  }
  undoStack = [];
  redoStack = [];
  updateUndoButtons();
  render();
}

function importMask() {
  openFilePicker(".json", (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.version === 3 && data.image) {
          loadProjectV3(data);
        } else if (data.version === 2) {
          if (!img) {
            alert("Load an image first before importing a v2 mask file.");
            return;
          }
          applyImportedMask(data);
        } else {
          alert("Unrecognized file format.");
          return;
        }
        const btn = document.getElementById("importMask");
        btn.textContent = "Loaded!";
        setTimeout(() => {
          btn.textContent = "Import";
        }, 1500);
      } catch {
        alert("Invalid mask file.");
      }
    };
    reader.readAsText(file);
  });
}

function loadSavedMask() {
  const raw = localStorage.getItem("wallMaskData");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.width !== img.width || data.height !== img.height) return;

    if (data.version === 2) {
      maskData = rlDecode(data.mask, img.width * img.height);
      if (data.zones && data.zones.length > 0) {
        zones = data.zones;
        activeZone = 0;
        renderZoneList();
      }
    } else {
      // Legacy format: convert manualMask (Int8Array: 1=wall, -1=erased, 0=auto)
      const decoded = new Int8Array(
        data.mask ? rlDecodeSigned(data.mask, img.width * img.height) : [],
      );
      maskData = new Uint8Array(img.width * img.height);
      for (let i = 0; i < decoded.length; i++) {
        if (decoded[i] === 1) maskData[i] = 1;
      }
    }
  } catch {
    /* ignore bad data */
  }
}

// ===== ZONE MANAGEMENT =====
function renderZoneList() {
  const container = document.getElementById("zoneList");
  container.innerHTML = "";
  zones.forEach((z, i) => {
    const div = document.createElement("div");
    div.className = "zone-entry" + (i === activeZone ? " active" : "");
    div.innerHTML = `
      <div class="zone-swatch" style="background:${z.color}" data-idx="${i}"></div>
      <div class="zone-info">
        <div class="zone-name">${z.name}</div>
        <div class="zone-hex">${z.color}</div>
      </div>
      ${zones.length > 1 ? `<button class="remove-btn" data-idx="${i}">&times;</button>` : ""}
    `;

    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) {
        removeZone(i);
        return;
      }
      if (e.target.classList.contains("zone-swatch")) {
        pickZoneColor(i);
        return;
      }
      activeZone = i;
      renderZoneList();
    });

    // Double-click name to rename
    const nameEl = div.querySelector(".zone-name");
    nameEl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.value = z.name;
      input.style.cssText =
        "background:#0f3460;border:1px solid #1a5276;color:white;font-size:13px;padding:1px 4px;border-radius:3px;width:100%;";
      nameEl.replaceWith(input);
      input.focus();
      input.select();
      const finish = () => {
        z.name = input.value || z.name;
        renderZoneList();
      };
      input.addEventListener("blur", finish);
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") input.blur();
      });
    });

    container.appendChild(div);
  });
}

function pickZoneColor(idx) {
  const picker = document.createElement("input");
  picker.type = "color";
  picker.value = zones[idx].color;
  picker.addEventListener("input", (e) => {
    zones[idx].color = e.target.value.toUpperCase();
    renderZoneList();
    render();
  });
  picker.click();
}

function removeZone(idx) {
  if (zones.length <= 1) return;
  const removedZoneVal = idx + 1;
  zones.splice(idx, 1);

  // Renumber mask data
  const len = maskData.length;
  for (let i = 0; i < len; i++) {
    if (maskData[i] === removedZoneVal) {
      maskData[i] = 0;
    } else if (maskData[i] > removedZoneVal) {
      maskData[i]--;
    }
  }

  if (activeZone >= zones.length) activeZone = zones.length - 1;
  renderZoneList();
  render();
}

function renderPresets() {
  const grid = document.getElementById("presetGrid");
  PRESETS.forEach((p) => {
    const div = document.createElement("div");
    div.className = "preset-swatch";
    div.style.background = p.hex;
    div.title = p.name;
    div.addEventListener("click", () => {
      zones[activeZone].color = p.hex;
      zones[activeZone].name = p.name;
      renderZoneList();
      render();
      closeSidebarIfMobile();
    });
    div.addEventListener("mouseenter", (e) => {
      if (
        "ontouchstart" in window &&
        !window.matchMedia("(hover: hover)").matches
      )
        return;
      tooltipEl.textContent = `${p.name} (${p.hex})`;
      tooltipEl.style.display = "block";
      tooltipEl.style.left = e.clientX + 12 + "px";
      tooltipEl.style.top = e.clientY - 28 + "px";
    });
    div.addEventListener("mouseleave", () => {
      tooltipEl.style.display = "none";
    });
    grid.appendChild(div);
  });
}

// ===== HINT =====
function showHint(msg) {
  hintOverlay.textContent = msg;
  hintOverlay.style.display = "block";
  setTimeout(() => {
    hintOverlay.style.display = "none";
  }, 5000);
}

// ===== BRUSH CURSOR =====
function updateBrushCursor(clientX, clientY) {
  if (viewMode !== "edit" || activeTool === "fill" || activeTool === "line") {
    brushCursor.style.display = "none";
    return;
  }
  const rect = mainCanvas.getBoundingClientRect();
  const inBounds =
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom;
  if (!inBounds) {
    brushCursor.style.display = "none";
    return;
  }
  const displaySize = brushSize * 2;
  brushCursor.style.display = "block";
  brushCursor.style.width = displaySize + "px";
  brushCursor.style.height = displaySize + "px";
  brushCursor.style.left = clientX - displaySize / 2 + "px";
  brushCursor.style.top = clientY - displaySize / 2 + "px";
  brushCursor.style.borderRadius = brushShape === "round" ? "50%" : "0";
  const tint = ZONE_TINTS[activeZone % ZONE_TINTS.length];
  brushCursor.style.borderColor =
    activeTool === "erase"
      ? "#f87171"
      : `rgb(${tint[0]},${tint[1]},${tint[2]})`;
}

// ===== LINE TOOL PREVIEW =====
function imageToScreen(imgX, imgY) {
  const rect = mainCanvas.getBoundingClientRect();
  const containerRect = canvasContainer.getBoundingClientRect();
  return {
    x: rect.left - containerRect.left + (imgX / img.width) * rect.width,
    y: rect.top - containerRect.top + (imgY / img.height) * rect.height,
  };
}

function updateLinePreview(clientX, clientY) {
  const preview = document.getElementById("linePreview");
  const marker = document.getElementById("lineStartMarker");
  if (!lineStartImg || activeTool !== "line") {
    preview.style.display = "none";
    marker.style.display = "none";
    return;
  }
  const start = imageToScreen(lineStartImg.x, lineStartImg.y);
  const containerRect = canvasContainer.getBoundingClientRect();
  const endX = clientX - containerRect.left;
  const endY = clientY - containerRect.top;

  // Set viewBox to match container pixel size so coordinates align
  const cw = containerRect.width;
  const ch = containerRect.height;
  preview.setAttribute("viewBox", `0 0 ${cw} ${ch}`);

  const line = document.getElementById("linePreviewLine");
  line.setAttribute("x1", start.x);
  line.setAttribute("y1", start.y);
  line.setAttribute("x2", endX);
  line.setAttribute("y2", endY);

  // Match brush width and shape
  const tint = ZONE_TINTS[activeZone % ZONE_TINTS.length];
  const cap = brushShape === "round" ? "round" : "butt";
  line.style.stroke = `rgba(${tint[0]},${tint[1]},${tint[2]}, 0.4)`;
  line.style.strokeWidth = brushSize * 2;
  line.style.strokeLinecap = cap;

  preview.style.display = "block";

  marker.style.left = start.x + "px";
  marker.style.top = start.y + "px";
  marker.style.display = "block";
}

function clearLinePreview() {
  lineStartImg = null;
  document.getElementById("linePreview").style.display = "none";
  document.getElementById("lineStartMarker").style.display = "none";
}

// ===== MOBILE SIDEBAR =====
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarOverlay").classList.add("visible");
  document.getElementById("sidebarToggle").style.display = "none";
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("visible");
  if (window.matchMedia("(max-width: 768px)").matches) {
    document.getElementById("sidebarToggle").style.display = "flex";
  }
}

function closeSidebarIfMobile() {
  if (window.matchMedia("(max-width: 768px)").matches) closeSidebar();
}

// ===== EVENTS =====
function setupEvents() {
  // Intensity
  document.getElementById("intensity").addEventListener("input", (e) => {
    intensity = +e.target.value;
    render();
  });

  // Blend mode
  document.getElementById("blendToggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    document
      .querySelectorAll("#blendToggle .mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    blendMode = btn.dataset.blend;
    render();
  });

  // View mode
  document.getElementById("viewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    setView(btn.dataset.view);
  });

  // Add zone
  document.getElementById("addZoneBtn").addEventListener("click", () => {
    const colors = [
      "#CDD2CA",
      "#D1C7B8",
      "#BDD0D4",
      "#B8A992",
      "#BCC2B2",
      "#CBCCC9",
    ];
    const color = colors[zones.length % colors.length];
    zones.push({ name: `Zone ${zones.length + 1}`, color });
    activeZone = zones.length - 1;
    renderZoneList();
  });

  // Save / Load
  document.getElementById("saveMask").addEventListener("click", saveMask);
  document.getElementById("loadMask").addEventListener("click", () => {
    if (!img) return;
    const raw = localStorage.getItem("wallMaskData");
    if (!raw) {
      alert("No saved mask found.");
      return;
    }
    try {
      const data = JSON.parse(raw);
      if (data.width !== img.width || data.height !== img.height) {
        alert("Saved mask dimensions do not match.");
        return;
      }
      if (data.version === 2) {
        maskData = rlDecode(data.mask, img.width * img.height);
        if (data.zones) {
          zones = data.zones;
          activeZone = 0;
          renderZoneList();
        }
      }
      undoStack = [];
      redoStack = [];
      updateUndoButtons();
      render();
      const btn = document.getElementById("loadMask");
      btn.textContent = "Loaded!";
      setTimeout(() => {
        btn.textContent = "Load";
      }, 1500);
    } catch {
      alert("Failed to load mask.");
    }
  });

  // Export / Import
  document.getElementById("exportMask").addEventListener("click", exportMask);
  document.getElementById("importMask").addEventListener("click", importMask);

  // Load Image (sidebar)
  document.getElementById("loadImageBtn").addEventListener("click", () => {
    openFilePicker("image/*", loadImageFromFile);
  });

  // Tools
  document
    .getElementById("toolBrush")
    .addEventListener("click", () => setTool("brush"));
  document
    .getElementById("toolErase")
    .addEventListener("click", () => setTool("erase"));
  document
    .getElementById("toolLine")
    .addEventListener("click", () => setTool("line"));
  document
    .getElementById("toolFill")
    .addEventListener("click", () => setTool("fill"));
  document.getElementById("brushSize").addEventListener("input", (e) => {
    brushSize = +e.target.value;
  });
  document.getElementById("brushShapeBtn").addEventListener("click", () => {
    brushShape = brushShape === "round" ? "square" : "round";
    document.getElementById("brushShapeBtn").innerHTML =
      brushShape === "round" ? "&#9679;" : "&#9632;";
    document.getElementById("brushShapeBtn").title =
      brushShape === "round"
        ? "Switch to square brush"
        : "Switch to round brush";
  });
  document.getElementById("fillTolerance").addEventListener("input", (e) => {
    fillTolerance = +e.target.value;
  });
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);

  document.getElementById("autoDetect").addEventListener("click", () => {
    autoDetectWalls(activeZone);
  });

  document.getElementById("resetMask").addEventListener("click", () => {
    beginStroke();
    for (let i = 0; i < maskData.length; i++) {
      recordPixel(i, maskData[i]);
      maskData[i] = 0;
    }
    endStroke();
    render();
  });

  // Zoom
  document.getElementById("zoomFit").addEventListener("click", resetZoom);

  canvasContainer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const rect = canvasContainer.getBoundingClientRect();
      zoomAtPoint(factor, e.clientX - rect.left, e.clientY - rect.top);
    },
    { passive: false },
  );

  // --- Mouse events ---
  mainCanvas.addEventListener("mousedown", (e) => {
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      // Middle click or Space+left click: pan
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartPanX = panX;
      panStartPanY = panY;
      e.preventDefault();
      return;
    }
    if (viewMode !== "edit") return;
    if (e.button !== 0) return;

    if (activeTool === "fill") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      floodFill(x, y);
      hintOverlay.style.display = "none";
      e.preventDefault();
      return;
    }

    if (activeTool === "line") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      if (!lineStartImg) {
        lineStartImg = { x, y };
        updateLinePreview(e.clientX, e.clientY);
      } else {
        beginStroke();
        paintLine(lineStartImg.x, lineStartImg.y, x, y);
        endStroke();
        lineStartImg = { x, y }; // chain: end becomes new start
        updateLinePreview(e.clientX, e.clientY);
      }
      hintOverlay.style.display = "none";
      e.preventDefault();
      return;
    }

    // Brush / erase
    isPainting = true;
    beginStroke();
    const { x, y } = getImageCoords(e.clientX, e.clientY);
    paintAt(x, y);
    render();
    lastPaintX = x;
    lastPaintY = y;
    hintOverlay.style.display = "none";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (isPanning) {
      panX = panStartPanX + (e.clientX - panStartX);
      panY = panStartPanY + (e.clientY - panStartY);
      canvasContainer.style.cursor = "grabbing";
      updateCanvasTransform();
      return;
    }
    if (draggingSlider) {
      const rect = mainCanvas.getBoundingClientRect();
      compareSplit = Math.max(
        0.02,
        Math.min(0.98, (e.clientX - rect.left) / rect.width),
      );
      updateCompareClip();
    }
    if (isPainting && viewMode === "edit") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      if (lastPaintX >= 0) paintLine(lastPaintX, lastPaintY, x, y);
      lastPaintX = x;
      lastPaintY = y;
    }
    if (draggingResize) {
      const newWidth = Math.max(
        180,
        Math.min(window.innerWidth * 0.5, e.clientX),
      );
      document.getElementById("sidebar").style.width = newWidth + "px";
    }
    updateBrushCursor(e.clientX, e.clientY);
    if (activeTool === "line" && lineStartImg)
      updateLinePreview(e.clientX, e.clientY);
  });

  window.addEventListener("mouseup", () => {
    if (isPanning) {
      isPanning = false;
      canvasContainer.style.cursor = spaceHeld ? "grab" : "";
      return;
    }
    if (isPainting) {
      isPainting = false;
      lastPaintX = -1;
      lastPaintY = -1;
      endStroke();
    }
    draggingSlider = false;
    if (draggingResize) {
      draggingResize = false;
      resizeHandle.classList.remove("active");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });

  // Compare slider
  const slider = document.getElementById("compareSlider");
  slider.addEventListener("mousedown", (e) => {
    draggingSlider = true;
    e.preventDefault();
  });
  slider.addEventListener(
    "touchstart",
    (e) => {
      draggingSlider = true;
      e.preventDefault();
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (draggingSlider && e.touches.length === 1) {
        const rect = mainCanvas.getBoundingClientRect();
        compareSplit = Math.max(
          0.02,
          Math.min(0.98, (e.touches[0].clientX - rect.left) / rect.width),
        );
        updateCompareClip();
        e.preventDefault();
      }
    },
    { passive: false },
  );

  window.addEventListener("touchend", () => {
    if (draggingSlider) draggingSlider = false;
  });

  // Sidebar resize
  const resizeHandle = document.getElementById("resizeHandle");
  let draggingResize = false;
  resizeHandle.addEventListener("mousedown", (e) => {
    draggingResize = true;
    resizeHandle.classList.add("active");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  // --- Touch events for canvas ---
  mainCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        // Pinch start
        if (isPainting) {
          isPainting = false;
          lastPaintX = -1;
          lastPaintY = -1;
          endStroke();
        }
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        lastPinchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        wasPinching = true;
        e.preventDefault();
        return;
      }

      if (e.touches.length === 1 && viewMode === "edit") {
        wasPinching = false;

        if (activeTool === "fill") {
          const { x, y } = getImageCoords(
            e.touches[0].clientX,
            e.touches[0].clientY,
          );
          floodFill(x, y);
          hintOverlay.style.display = "none";
          e.preventDefault();
          return;
        }

        if (activeTool === "line") {
          const { x, y } = getImageCoords(
            e.touches[0].clientX,
            e.touches[0].clientY,
          );
          if (!lineStartImg) {
            lineStartImg = { x, y };
            updateLinePreview(e.touches[0].clientX, e.touches[0].clientY);
          } else {
            beginStroke();
            paintLine(lineStartImg.x, lineStartImg.y, x, y);
            endStroke();
            lineStartImg = { x, y };
            updateLinePreview(e.touches[0].clientX, e.touches[0].clientY);
          }
          hintOverlay.style.display = "none";
          e.preventDefault();
          return;
        }

        isPainting = true;
        beginStroke();
        const { x, y } = getImageCoords(
          e.touches[0].clientX,
          e.touches[0].clientY,
        );
        paintAt(x, y);
        render();
        lastPaintX = x;
        lastPaintY = y;
        hintOverlay.style.display = "none";
        e.preventDefault();
      }
    },
    { passive: false },
  );

  mainCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        // Pinch zoom / pan
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const center = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };

        if (lastPinchDist > 0) {
          // Pan
          panX += center.x - lastPinchCenter.x;
          panY += center.y - lastPinchCenter.y;

          // Zoom
          const scale = dist / lastPinchDist;
          const rect = canvasContainer.getBoundingClientRect();
          const cx = center.x - rect.left;
          const cy = center.y - rect.top;
          zoomAtPoint(scale, cx, cy);
        }

        lastPinchDist = dist;
        lastPinchCenter = center;
        e.preventDefault();
        return;
      }

      if (
        isPainting &&
        viewMode === "edit" &&
        e.touches.length === 1 &&
        !wasPinching
      ) {
        const { x, y } = getImageCoords(
          e.touches[0].clientX,
          e.touches[0].clientY,
        );
        if (lastPaintX >= 0) paintLine(lastPaintX, lastPaintY, x, y);
        lastPaintX = x;
        lastPaintY = y;
        e.preventDefault();
      }
    },
    { passive: false },
  );

  mainCanvas.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) {
      lastPinchDist = 0;
      lastPinchCenter = null;
    }
    if (e.touches.length === 0) {
      if (isPainting) {
        isPainting = false;
        lastPaintX = -1;
        lastPaintY = -1;
        endStroke();
      }
      wasPinching = false;
    }
  });

  // Mobile sidebar
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", openSidebar);
  document
    .getElementById("sidebarOverlay")
    .addEventListener("click", closeSidebar);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;

    if (e.key === " " && !e.repeat) {
      e.preventDefault();
      spaceHeld = true;
      canvasContainer.style.cursor = "grab";
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if (
      (e.metaKey || e.ctrlKey) &&
      (e.key === "y" || (e.key === "z" && e.shiftKey))
    ) {
      e.preventDefault();
      redo();
      return;
    }

    if (e.key === "1") setView("edit");
    if (e.key === "2") setView("preview");
    if (e.key === "3") setView("compare");
    if (e.key === "b" || e.key === "B") setTool("brush");
    if (e.key === "e" || e.key === "E") setTool("erase");
    if (e.key === "l" || e.key === "L") setTool("line");
    if (e.key === "g" || e.key === "G") setTool("fill");
    if (e.key === "Escape") clearLinePreview();
    if (e.key === "0") resetZoom();

    if (e.key === "[") {
      brushSize = Math.max(3, brushSize - 10);
      document.getElementById("brushSize").value = brushSize;
    }
    if (e.key === "]") {
      brushSize = Math.min(200, brushSize + 10);
      document.getElementById("brushSize").value = brushSize;
    }

    // Switch active zone with Tab
    if (e.key === "Tab" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      activeZone = (activeZone + 1) % zones.length;
      renderZoneList();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === " ") {
      spaceHeld = false;
      if (isPanning) {
        isPanning = false;
      }
      canvasContainer.style.cursor = "";
    }
  });

  // Window resize
  window.addEventListener("resize", () => {
    if (img) resetZoom();
  });
}

function setView(mode) {
  viewMode = mode;
  document.querySelectorAll("#viewToggle .mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === mode);
  });
  if (mode !== "edit") brushCursor.style.display = "none";
  render();
}

function setTool(tool) {
  activeTool = tool;
  clearLinePreview();
  document.getElementById("toolBrush").className =
    "tool-btn" + (tool === "brush" ? " active" : "");
  document.getElementById("toolErase").className =
    "tool-btn" + (tool === "erase" ? " erase-active" : "");
  document.getElementById("toolLine").className =
    "tool-btn" + (tool === "line" ? " active" : "");
  document.getElementById("toolFill").className =
    "tool-btn" + (tool === "fill" ? " active" : "");

  // Show/hide tolerance slider
  const show = tool === "fill";
  document.getElementById("tolSep").style.display = show ? "" : "none";
  document.getElementById("tolLabel").style.display = show ? "" : "none";
  document.getElementById("fillTolerance").style.display = show ? "" : "none";

  if (tool === "fill" || tool === "line") brushCursor.style.display = "none";
}

init();
