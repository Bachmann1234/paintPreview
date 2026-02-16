import { state, els } from "./state.js";
import { render, updateCompareClip } from "./render.js";
import {
  beginStroke,
  endStroke,
  undo,
  redo,
  getImageCoords,
  paintAt,
  paintLine,
  floodFill,
  autoDetectWalls,
  updateBrushCursor,
  updateLinePreview,
  clearLinePreview,
} from "./masks.js";
import { renderZoneList, renderPresets } from "./zones.js";
import {
  exportProject,
  importProject,
  loadImageFromFile,
  openFilePicker,
  handleProjectOrMaskFile,
  switchProject,
  createNewProject,
  deleteProject,
  renameProject,
} from "./project.js";

// ===== ZOOM / PAN =====
export function updateCanvasTransform() {
  els.canvasWrapper.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomScale})`;
  document.getElementById("zoomDisplay").textContent =
    Math.round(state.zoomScale * 100) + "%";
}

export function resetZoom() {
  if (!state.img) return;
  const cRect = els.canvasContainer.getBoundingClientRect();
  const scaleX = cRect.width / state.img.width;
  const scaleY = cRect.height / state.img.height;
  state.zoomScale = Math.min(scaleX, scaleY, 1);

  const displayW = state.img.width * state.zoomScale;
  const displayH = state.img.height * state.zoomScale;
  state.panX = (cRect.width - displayW) / 2;
  state.panY = (cRect.height - displayH) / 2;

  updateCanvasTransform();
}

function zoomAtPoint(factor, cx, cy) {
  const newScale = Math.max(0.1, Math.min(15, state.zoomScale * factor));
  const ratio = newScale / state.zoomScale;
  state.panX = cx - (cx - state.panX) * ratio;
  state.panY = cy - (cy - state.panY) * ratio;
  state.zoomScale = newScale;
  updateCanvasTransform();
}

// ===== VIEW / TOOL =====
export function setView(mode) {
  state.viewMode = mode;
  document.querySelectorAll("#viewToggle .mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === mode);
  });
  if (mode !== "edit") els.brushCursor.style.display = "none";
  render();
}

export function setTool(tool) {
  state.activeTool = tool;
  clearLinePreview();
  document.getElementById("toolBrush").className =
    "tool-btn" + (tool === "brush" ? " active" : "");
  document.getElementById("toolErase").className =
    "tool-btn" + (tool === "erase" ? " erase-active" : "");
  document.getElementById("toolLine").className =
    "tool-btn" + (tool === "line" ? " active" : "");
  document.getElementById("toolFill").className =
    "tool-btn" + (tool === "fill" ? " active" : "");

  const show = tool === "fill";
  document.getElementById("tolSep").style.display = show ? "" : "none";
  document.getElementById("tolLabel").style.display = show ? "" : "none";
  document.getElementById("fillTolerance").style.display = show ? "" : "none";

  if (tool === "fill" || tool === "line")
    els.brushCursor.style.display = "none";
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

export function closeSidebarIfMobile() {
  if (window.matchMedia("(max-width: 768px)").matches) closeSidebar();
}

// ===== START SCREEN =====
export function setupStartScreen() {
  document.getElementById("startLoadImage").addEventListener("click", () => {
    openFilePicker("image/*", loadImageFromFile);
  });

  document.getElementById("startOpenProject").addEventListener("click", () => {
    openFilePicker(".json", (file) => handleProjectOrMaskFile(file, true));
  });

  const dropZone = document.getElementById("startDrop");
  els.startScreen.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  els.startScreen.addEventListener("dragleave", (e) => {
    if (!els.startScreen.contains(e.relatedTarget)) {
      dropZone.classList.remove("dragover");
    }
  });
  els.startScreen.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.endsWith(".json")) {
      handleProjectOrMaskFile(file, true);
    } else if (file.type.startsWith("image/")) {
      loadImageFromFile(file);
    }
  });
}

// ===== PROJECT SWITCHER EVENTS =====
function setupProjectEvents() {
  const sel = document.getElementById("projectSelect");
  if (!sel) return;

  sel.addEventListener("change", (e) => {
    if (e.target.value === "__new__") {
      const name = prompt("New project name:");
      if (name) {
        createNewProject(name);
      } else {
        // Reset selection back to current
        sel.value = state.currentProjectId;
      }
    } else {
      switchProject(e.target.value);
    }
  });

  document.getElementById("projectRenameBtn").addEventListener("click", () => {
    if (!state.currentProjectId) return;
    const sel = document.getElementById("projectSelect");
    const current = sel.options[sel.selectedIndex];
    const name = prompt("Rename project:", current?.textContent || "");
    if (name) {
      renameProject(state.currentProjectId, name);
    }
  });

  document.getElementById("projectDeleteBtn").addEventListener("click", () => {
    if (!state.currentProjectId) return;
    deleteProject(state.currentProjectId);
  });
}

// ===== MAIN EVENT SETUP =====
export function setupEvents() {
  // Project switcher
  setupProjectEvents();

  // Intensity
  document.getElementById("intensity").addEventListener("input", (e) => {
    state.intensity = +e.target.value;
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
    state.blendMode = btn.dataset.blend;
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
    const color = colors[state.zones.length % colors.length];
    state.zones.push({ name: `Zone ${state.zones.length + 1}`, color });
    state.activeZone = state.zones.length - 1;
    renderZoneList();
  });

  // Export / Import
  document
    .getElementById("exportMask")
    .addEventListener("click", exportProject);
  document
    .getElementById("importMask")
    .addEventListener("click", importProject);

  // Load Image (sidebar)
  document.getElementById("loadImageBtn").addEventListener("click", () => {
    openFilePicker("image/*", loadImageFromFile);
  });

  // Preset search
  document.getElementById("presetSearch").addEventListener("input", (e) => {
    renderPresets(e.target.value);
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
    state.brushSize = +e.target.value;
  });
  document.getElementById("brushShapeBtn").addEventListener("click", () => {
    state.brushShape = state.brushShape === "round" ? "square" : "round";
    document.getElementById("brushShapeBtn").innerHTML =
      state.brushShape === "round" ? "&#9679;" : "&#9632;";
    document.getElementById("brushShapeBtn").title =
      state.brushShape === "round"
        ? "Switch to square brush"
        : "Switch to round brush";
  });
  document.getElementById("fillTolerance").addEventListener("input", (e) => {
    state.fillTolerance = +e.target.value;
  });
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);

  document.getElementById("autoDetect").addEventListener("click", () => {
    autoDetectWalls(state.activeZone);
  });

  document.getElementById("resetMask").addEventListener("click", () => {
    beginStroke();
    for (let i = 0; i < state.maskData.length; i++) {
      if (state.maskData[i] !== 0) {
        state.currentDiff.set(i, state.maskData[i]);
        state.maskData[i] = 0;
      }
    }
    endStroke();
    render();
  });

  // Zoom
  document.getElementById("zoomFit").addEventListener("click", resetZoom);

  els.canvasContainer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const rect = els.canvasContainer.getBoundingClientRect();
      zoomAtPoint(factor, e.clientX - rect.left, e.clientY - rect.top);
    },
    { passive: false },
  );

  // --- Mouse events ---
  els.mainCanvas.addEventListener("mousedown", (e) => {
    if (e.button === 1 || (e.button === 0 && state.spaceHeld)) {
      state.isPanning = true;
      state.panStartX = e.clientX;
      state.panStartY = e.clientY;
      state.panStartPanX = state.panX;
      state.panStartPanY = state.panY;
      e.preventDefault();
      return;
    }
    if (state.viewMode !== "edit") return;
    if (e.button !== 0) return;

    if (state.activeTool === "fill") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      floodFill(x, y);
      els.hintOverlay.style.display = "none";
      e.preventDefault();
      return;
    }

    if (state.activeTool === "line") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      if (!state.lineStartImg) {
        state.lineStartImg = { x, y };
        updateLinePreview(e.clientX, e.clientY);
      } else {
        beginStroke();
        paintLine(state.lineStartImg.x, state.lineStartImg.y, x, y);
        endStroke();
        state.lineStartImg = { x, y };
        updateLinePreview(e.clientX, e.clientY);
      }
      els.hintOverlay.style.display = "none";
      e.preventDefault();
      return;
    }

    // Brush / erase
    state.isPainting = true;
    beginStroke();
    const { x, y } = getImageCoords(e.clientX, e.clientY);
    paintAt(x, y);
    render();
    state.lastPaintX = x;
    state.lastPaintY = y;
    els.hintOverlay.style.display = "none";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (state.isPanning) {
      state.panX = state.panStartPanX + (e.clientX - state.panStartX);
      state.panY = state.panStartPanY + (e.clientY - state.panStartY);
      els.canvasContainer.style.cursor = "grabbing";
      updateCanvasTransform();
      return;
    }
    if (state.draggingSlider) {
      const rect = els.mainCanvas.getBoundingClientRect();
      state.compareSplit = Math.max(
        0.02,
        Math.min(0.98, (e.clientX - rect.left) / rect.width),
      );
      updateCompareClip();
    }
    if (state.isPainting && state.viewMode === "edit") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      if (state.lastPaintX >= 0)
        paintLine(state.lastPaintX, state.lastPaintY, x, y);
      state.lastPaintX = x;
      state.lastPaintY = y;
    }
    if (draggingResize) {
      const newWidth = Math.max(
        180,
        Math.min(window.innerWidth * 0.5, e.clientX),
      );
      document.getElementById("sidebar").style.width = newWidth + "px";
    }
    updateBrushCursor(e.clientX, e.clientY);
    if (state.activeTool === "line" && state.lineStartImg)
      updateLinePreview(e.clientX, e.clientY);
  });

  window.addEventListener("mouseup", () => {
    if (state.isPanning) {
      state.isPanning = false;
      els.canvasContainer.style.cursor = state.spaceHeld ? "grab" : "";
      return;
    }
    if (state.isPainting) {
      state.isPainting = false;
      state.lastPaintX = -1;
      state.lastPaintY = -1;
      endStroke();
    }
    state.draggingSlider = false;
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
    state.draggingSlider = true;
    e.preventDefault();
  });
  slider.addEventListener(
    "touchstart",
    (e) => {
      state.draggingSlider = true;
      e.preventDefault();
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (state.draggingSlider && e.touches.length === 1) {
        const rect = els.mainCanvas.getBoundingClientRect();
        state.compareSplit = Math.max(
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
    if (state.draggingSlider) state.draggingSlider = false;
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
  els.mainCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        if (state.isPainting) {
          state.isPainting = false;
          state.lastPaintX = -1;
          state.lastPaintY = -1;
          endStroke();
        }
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        state.lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        state.lastPinchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        state.wasPinching = true;
        e.preventDefault();
        return;
      }

      if (e.touches.length === 1 && state.viewMode === "edit") {
        state.wasPinching = false;

        if (state.activeTool === "fill") {
          const { x, y } = getImageCoords(
            e.touches[0].clientX,
            e.touches[0].clientY,
          );
          floodFill(x, y);
          els.hintOverlay.style.display = "none";
          e.preventDefault();
          return;
        }

        if (state.activeTool === "line") {
          const { x, y } = getImageCoords(
            e.touches[0].clientX,
            e.touches[0].clientY,
          );
          if (!state.lineStartImg) {
            state.lineStartImg = { x, y };
            updateLinePreview(e.touches[0].clientX, e.touches[0].clientY);
          } else {
            beginStroke();
            paintLine(state.lineStartImg.x, state.lineStartImg.y, x, y);
            endStroke();
            state.lineStartImg = { x, y };
            updateLinePreview(e.touches[0].clientX, e.touches[0].clientY);
          }
          els.hintOverlay.style.display = "none";
          e.preventDefault();
          return;
        }

        state.isPainting = true;
        beginStroke();
        const { x, y } = getImageCoords(
          e.touches[0].clientX,
          e.touches[0].clientY,
        );
        paintAt(x, y);
        render();
        state.lastPaintX = x;
        state.lastPaintY = y;
        els.hintOverlay.style.display = "none";
        e.preventDefault();
      }
    },
    { passive: false },
  );

  els.mainCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const center = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };

        if (state.lastPinchDist > 0) {
          state.panX += center.x - state.lastPinchCenter.x;
          state.panY += center.y - state.lastPinchCenter.y;

          const scale = dist / state.lastPinchDist;
          const rect = els.canvasContainer.getBoundingClientRect();
          const cx = center.x - rect.left;
          const cy = center.y - rect.top;
          zoomAtPoint(scale, cx, cy);
        }

        state.lastPinchDist = dist;
        state.lastPinchCenter = center;
        e.preventDefault();
        return;
      }

      if (
        state.isPainting &&
        state.viewMode === "edit" &&
        e.touches.length === 1 &&
        !state.wasPinching
      ) {
        const { x, y } = getImageCoords(
          e.touches[0].clientX,
          e.touches[0].clientY,
        );
        if (state.lastPaintX >= 0)
          paintLine(state.lastPaintX, state.lastPaintY, x, y);
        state.lastPaintX = x;
        state.lastPaintY = y;
        e.preventDefault();
      }
    },
    { passive: false },
  );

  els.mainCanvas.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) {
      state.lastPinchDist = 0;
      state.lastPinchCenter = null;
    }
    if (e.touches.length === 0) {
      if (state.isPainting) {
        state.isPainting = false;
        state.lastPaintX = -1;
        state.lastPaintY = -1;
        endStroke();
      }
      state.wasPinching = false;
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
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

    if (e.key === " " && !e.repeat) {
      e.preventDefault();
      state.spaceHeld = true;
      els.canvasContainer.style.cursor = "grab";
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
      state.brushSize = Math.max(3, state.brushSize - 10);
      document.getElementById("brushSize").value = state.brushSize;
    }
    if (e.key === "]") {
      state.brushSize = Math.min(200, state.brushSize + 10);
      document.getElementById("brushSize").value = state.brushSize;
    }

    if (e.key === "Tab" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      state.activeZone = (state.activeZone + 1) % state.zones.length;
      renderZoneList();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === " ") {
      state.spaceHeld = false;
      if (state.isPanning) {
        state.isPanning = false;
      }
      els.canvasContainer.style.cursor = "";
    }
  });

  // Window resize
  window.addEventListener("resize", () => {
    if (state.img) resetZoom();
  });
}
