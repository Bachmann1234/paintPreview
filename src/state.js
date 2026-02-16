// Shared mutable application state
// All modules import from here to avoid circular dependencies.

import { PRESETS } from "./presets.js";

export { PRESETS };

// Zone overlay colors for edit view (hue tints)
export const ZONE_TINTS = [
  [60, 190, 220], // teal
  [220, 150, 50], // amber
  [180, 80, 220], // purple
  [80, 210, 120], // green
  [220, 80, 120], // pink
  [80, 160, 220], // blue
];

export const MAX_UNDO = 50;

// ===== STATE =====
export const state = {
  img: null,
  imageDataUrl: null,
  originalData: null,
  maskData: null, // Uint8Array: 0=bg, 1=zone1, 2=zone2, ...

  zones: [
    { name: "Zone 1", color: "#D1CBC1" },
    { name: "Zone 2", color: "#CDD2CA" },
  ],
  activeZone: 0,

  intensity: 75,
  blendMode: "multiply",
  viewMode: "edit",
  activeTool: "brush",
  brushSize: 40,
  brushShape: "round", // 'round' or 'square'
  fillTolerance: 32,

  // Undo / redo
  undoStack: [],
  redoStack: [],
  currentDiff: null,

  // Zoom / pan
  zoomScale: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  panStartPanX: 0,
  panStartPanY: 0,
  spaceHeld: false,

  // Painting
  isPainting: false,
  lastPaintX: -1,
  lastPaintY: -1,

  // Line tool
  lineStartImg: null,

  // Compare
  compareSplit: 0.5,
  draggingSlider: false,

  // Pinch zoom
  lastPinchDist: 0,
  lastPinchCenter: null,
  wasPinching: false,

  // Project switcher
  currentProjectId: null,
};

// DOM element refs (populated once at init)
export const els = {
  mainCanvas: null,
  compareCanvas: null,
  mainCtx: null,
  compareCtx: null,
  canvasWrapper: null,
  canvasContainer: null,
  startScreen: null,
  tooltip: null,
  brushCursor: null,
  hintOverlay: null,
};

export function initElements() {
  els.mainCanvas = document.getElementById("mainCanvas");
  els.compareCanvas = document.getElementById("compareCanvas");
  els.mainCtx = els.mainCanvas.getContext("2d", { willReadFrequently: true });
  els.compareCtx = els.compareCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  els.canvasWrapper = document.getElementById("canvasWrapper");
  els.canvasContainer = document.getElementById("canvasContainer");
  els.startScreen = document.getElementById("startScreen");
  els.tooltip = document.getElementById("tooltip");
  els.brushCursor = document.getElementById("brushCursor");
  els.hintOverlay = document.getElementById("hintOverlay");
}
