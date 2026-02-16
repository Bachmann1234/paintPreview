import { state, els, MAX_UNDO, ZONE_TINTS } from "./state.js";
import { render } from "./render.js";

// ===== UNDO / REDO =====
export function beginStroke() {
  state.currentDiff = new Map();
  state.redoStack = [];
}

export function endStroke() {
  if (state.currentDiff && state.currentDiff.size > 0) {
    state.undoStack.push(state.currentDiff);
    if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
  }
  state.currentDiff = null;
  updateUndoButtons();
}

function recordPixel(i, oldVal) {
  if (state.currentDiff && !state.currentDiff.has(i)) {
    state.currentDiff.set(i, oldVal);
  }
}

export function undo() {
  if (state.undoStack.length === 0) return;
  const diff = state.undoStack.pop();
  const redo = new Map();
  for (const [i, oldVal] of diff) {
    redo.set(i, state.maskData[i]);
    state.maskData[i] = oldVal;
  }
  state.redoStack.push(redo);
  updateUndoButtons();
  render();
}

export function redo() {
  if (state.redoStack.length === 0) return;
  const diff = state.redoStack.pop();
  const und = new Map();
  for (const [i, oldVal] of diff) {
    und.set(i, state.maskData[i]);
    state.maskData[i] = oldVal;
  }
  state.undoStack.push(und);
  updateUndoButtons();
  render();
}

export function updateUndoButtons() {
  document.getElementById("undoBtn").disabled = state.undoStack.length === 0;
  document.getElementById("redoBtn").disabled = state.redoStack.length === 0;
}

// ===== COORDS =====
export function getImageCoords(clientX, clientY) {
  const rect = els.mainCanvas.getBoundingClientRect();
  const scaleX = state.img.width / rect.width;
  const scaleY = state.img.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function getImageBrushRadius() {
  const rect = els.mainCanvas.getBoundingClientRect();
  return state.brushSize * (state.img.width / rect.width);
}

// ===== PAINTING =====
export function paintAt(cx, cy) {
  const w = state.img.width,
    h = state.img.height;
  const r = getImageBrushRadius();
  const val = state.activeTool === "erase" ? 0 : state.activeZone + 1;

  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  const isRound = state.brushShape === "round";
  const r2 = r * r;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (isRound) {
        const dx = x - cx,
          dy = y - cy;
        if (dx * dx + dy * dy > r2) continue;
      }
      const i = y * w + x;
      recordPixel(i, state.maskData[i]);
      state.maskData[i] = val;
    }
  }
}

export function paintLine(x0, y0, x1, y1) {
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

export function floodFill(startX, startY) {
  const w = state.img.width,
    h = state.img.height;
  const sx = Math.round(startX),
    sy = Math.round(startY);
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const src = state.originalData.data;
  const startI = sy * w + sx;
  const startIdx = startI * 4;
  const sr = src[startIdx],
    sg = src[startIdx + 1],
    sb = src[startIdx + 2];
  const tol2 = state.fillTolerance * state.fillTolerance * 3;
  const val = state.activeZone + 1;

  if (state.maskData[startI] === val) return;

  const visited = new Uint8Array(w * h);
  const queue = [startI];
  let qi = 0;
  visited[startI] = 1;

  beginStroke();

  while (qi < queue.length) {
    const i = queue[qi++];
    recordPixel(i, state.maskData[i]);
    state.maskData[i] = val;

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

export function autoDetectWalls(targetZone) {
  const src = state.originalData.data;
  const w = state.img.width,
    h = state.img.height;
  const val = targetZone + 1;
  const len = w * h;

  beginStroke();

  for (let i = 0; i < len; i++) {
    if (state.maskData[i] !== 0) continue;
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
      recordPixel(i, state.maskData[i]);
      state.maskData[i] = val;
    }
  }

  endStroke();
  render();
}

// ===== BRUSH CURSOR =====
export function updateBrushCursor(clientX, clientY) {
  const { brushCursor } = els;
  if (
    state.viewMode !== "edit" ||
    state.activeTool === "fill" ||
    state.activeTool === "line"
  ) {
    brushCursor.style.display = "none";
    return;
  }
  const rect = els.mainCanvas.getBoundingClientRect();
  const inBounds =
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom;
  if (!inBounds) {
    brushCursor.style.display = "none";
    return;
  }
  const displaySize = state.brushSize * 2;
  brushCursor.style.display = "block";
  brushCursor.style.width = displaySize + "px";
  brushCursor.style.height = displaySize + "px";
  brushCursor.style.left = clientX - displaySize / 2 + "px";
  brushCursor.style.top = clientY - displaySize / 2 + "px";
  brushCursor.style.borderRadius = state.brushShape === "round" ? "50%" : "0";
  const tint = ZONE_TINTS[state.activeZone % ZONE_TINTS.length];
  brushCursor.style.borderColor =
    state.activeTool === "erase"
      ? "#f87171"
      : `rgb(${tint[0]},${tint[1]},${tint[2]})`;
}

// ===== LINE TOOL PREVIEW =====
function imageToScreen(imgX, imgY) {
  const rect = els.mainCanvas.getBoundingClientRect();
  const containerRect = els.canvasContainer.getBoundingClientRect();
  return {
    x: rect.left - containerRect.left + (imgX / state.img.width) * rect.width,
    y: rect.top - containerRect.top + (imgY / state.img.height) * rect.height,
  };
}

export function updateLinePreview(clientX, clientY) {
  const preview = document.getElementById("linePreview");
  const marker = document.getElementById("lineStartMarker");
  if (!state.lineStartImg || state.activeTool !== "line") {
    preview.style.display = "none";
    marker.style.display = "none";
    return;
  }
  const start = imageToScreen(state.lineStartImg.x, state.lineStartImg.y);
  const containerRect = els.canvasContainer.getBoundingClientRect();
  const endX = clientX - containerRect.left;
  const endY = clientY - containerRect.top;

  const cw = containerRect.width;
  const ch = containerRect.height;
  preview.setAttribute("viewBox", `0 0 ${cw} ${ch}`);

  const line = document.getElementById("linePreviewLine");
  line.setAttribute("x1", start.x);
  line.setAttribute("y1", start.y);
  line.setAttribute("x2", endX);
  line.setAttribute("y2", endY);

  const tint = ZONE_TINTS[state.activeZone % ZONE_TINTS.length];
  const cap = state.brushShape === "round" ? "round" : "butt";
  line.style.stroke = `rgba(${tint[0]},${tint[1]},${tint[2]}, 0.4)`;
  line.style.strokeWidth = state.brushSize * 2;
  line.style.strokeLinecap = cap;

  preview.style.display = "block";

  marker.style.left = start.x + "px";
  marker.style.top = start.y + "px";
  marker.style.display = "block";
}

export function clearLinePreview() {
  state.lineStartImg = null;
  document.getElementById("linePreview").style.display = "none";
  document.getElementById("lineStartMarker").style.display = "none";
}

// ===== HINT =====
export function showHint(msg) {
  els.hintOverlay.textContent = msg;
  els.hintOverlay.style.display = "block";
  setTimeout(() => {
    els.hintOverlay.style.display = "none";
  }, 5000);
}
