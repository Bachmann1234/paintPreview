import { rlEncode, rlDecode } from "./utils.js";
import { state, els } from "./state.js";
import { render } from "./render.js";
import { updateUndoButtons } from "./masks.js";
import { renderZoneList } from "./zones.js";
import { resetZoom, setView } from "./events.js";
import { showHint } from "./masks.js";
import {
  saveProject as dbSave,
  loadProject as dbLoad,
  deleteProjectData,
} from "./db.js";

// ===== ERROR FEEDBACK =====
function showSaveError(err) {
  console.error("Save failed:", err);
  showHint("Save failed — changes may not persist.");
}

// ===== IMAGE SETUP =====
export function setupImageFromDataUrl(dataUrl) {
  state.imageDataUrl = dataUrl;
  state.img = new Image();
  state.img.onload = () => {
    els.mainCanvas.width = state.img.width;
    els.mainCanvas.height = state.img.height;
    els.compareCanvas.width = state.img.width;
    els.compareCanvas.height = state.img.height;

    els.mainCtx.drawImage(state.img, 0, 0);
    state.originalData = els.mainCtx.getImageData(
      0,
      0,
      state.img.width,
      state.img.height,
    );

    state.maskData = new Uint8Array(state.img.width * state.img.height);

    state.undoStack = [];
    state.redoStack = [];
    updateUndoButtons();

    resetZoom();
    render();
    els.startScreen.classList.add("hidden");

    if (!state.maskData.some((v) => v > 0)) {
      showHint("Paint wall areas with the brush, then switch to Preview");
    }
  };
  state.img.src = dataUrl;
}

export function loadImageFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => setupImageFromDataUrl(reader.result);
  reader.readAsDataURL(file);
}

export function openFilePicker(accept, callback) {
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

// ===== PROJECT V3 =====
export function loadProjectV3(data) {
  const tempImg = new Image();
  tempImg.onload = () => {
    state.imageDataUrl = data.image;
    state.img = tempImg;

    els.mainCanvas.width = state.img.width;
    els.mainCanvas.height = state.img.height;
    els.compareCanvas.width = state.img.width;
    els.compareCanvas.height = state.img.height;

    els.mainCtx.drawImage(state.img, 0, 0);
    state.originalData = els.mainCtx.getImageData(
      0,
      0,
      state.img.width,
      state.img.height,
    );

    state.maskData = rlDecode(data.mask, state.img.width * state.img.height);
    if (data.zones) {
      state.zones = data.zones;
      state.activeZone = 0;
      renderZoneList();
    }

    state.undoStack = [];
    state.redoStack = [];
    updateUndoButtons();

    resetZoom();
    render();
    setView("preview");
    els.startScreen.classList.add("hidden");
  };
  tempImg.src = data.image;
}

function getProjectPayload() {
  return {
    version: 3,
    width: state.img.width,
    height: state.img.height,
    zones: state.zones,
    mask: rlEncode(state.maskData),
    image: state.imageDataUrl,
  };
}

// ===== MULTI-PROJECT STORAGE =====
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getProjectList() {
  try {
    const raw = localStorage.getItem("wallProjectList");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjectList(list) {
  localStorage.setItem("wallProjectList", JSON.stringify(list));
}

export function renderProjectSelect() {
  const sel = document.getElementById("projectSelect");
  if (!sel) return;
  const list = getProjectList();
  sel.innerHTML = "";
  list.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === state.currentProjectId) opt.selected = true;
    sel.appendChild(opt);
  });
  // Add "new project" option
  const newOpt = document.createElement("option");
  newOpt.value = "__new__";
  newOpt.textContent = "+ New Project...";
  sel.appendChild(newOpt);
}

// ===== MIGRATION: localStorage → IndexedDB =====
async function migrateLocalStorageToIDB() {
  if (localStorage.getItem("wallProject_idb_migrated") === "1") return;

  // Legacy single-key format → IndexedDB
  try {
    const oldRaw = localStorage.getItem("wallProject");
    const hasList = localStorage.getItem("wallProjectList");
    if (oldRaw && !hasList) {
      const id = generateId();
      const data = JSON.parse(oldRaw);
      await dbSave(id, data);
      saveProjectList([{ id, name: "Project 1" }]);
      localStorage.setItem("wallProjectActive", id);
      localStorage.removeItem("wallProject");
    }
  } catch (err) {
    console.error("Legacy migration failed:", err);
  }

  // Multi-project localStorage → IndexedDB
  const list = getProjectList();
  for (const entry of list) {
    try {
      const raw = localStorage.getItem(`wallProject_${entry.id}`);
      if (raw) {
        await dbSave(entry.id, JSON.parse(raw));
        localStorage.removeItem(`wallProject_${entry.id}`);
      }
    } catch (err) {
      console.error(`Migration failed for project ${entry.id}:`, err);
    }
  }

  localStorage.setItem("wallProject_idb_migrated", "1");
}

// ===== AUTO-SAVE =====
let autoSaveTimer = null;
export function scheduleAutoSave() {
  if (!state.img) return;
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    try {
      if (!state.currentProjectId) {
        // First save — create a project entry
        state.currentProjectId = generateId();
        const list = getProjectList();
        list.push({ id: state.currentProjectId, name: "Project 1" });
        saveProjectList(list);
        renderProjectSelect();
      }
      await dbSave(state.currentProjectId, getProjectPayload());
      localStorage.setItem("wallProjectActive", state.currentProjectId);
    } catch (err) {
      showSaveError(err);
    }
  }, 1000);
}

// ===== LOAD LAST PROJECT =====
export async function loadLastProject() {
  await migrateLocalStorageToIDB();

  // Check for legacy data that was just migrated
  try {
    const activeId = localStorage.getItem("wallProjectActive");
    const list = getProjectList();
    if (!activeId || list.length === 0) return false;

    const entry = list.find((p) => p.id === activeId);
    if (!entry) return false;

    const data = await dbLoad(activeId);
    if (!data) return false;

    state.currentProjectId = activeId;
    renderProjectSelect();

    if (data.version === 3 && data.image) {
      loadProjectV3(data);
      return true;
    }
  } catch (err) {
    console.error("Failed to load project:", err);
  }
  return false;
}

// ===== SWITCH PROJECT =====
export async function switchProject(id) {
  // Save current project immediately
  if (state.img && state.currentProjectId) {
    try {
      await dbSave(state.currentProjectId, getProjectPayload());
    } catch (err) {
      showSaveError(err);
    }
  }

  // Load the selected project
  try {
    const data = await dbLoad(id);
    if (!data) return;
    state.currentProjectId = id;
    localStorage.setItem("wallProjectActive", id);
    renderProjectSelect();
    if (data.version === 3 && data.image) {
      loadProjectV3(data);
    }
  } catch (err) {
    console.error("Failed to load project:", err);
  }
}

// ===== CREATE NEW PROJECT =====
export async function createNewProject(name) {
  // Save current project first
  if (state.img && state.currentProjectId) {
    try {
      await dbSave(state.currentProjectId, getProjectPayload());
    } catch (err) {
      showSaveError(err);
    }
  }

  const id = generateId();
  const list = getProjectList();
  list.push({ id, name });
  saveProjectList(list);

  state.currentProjectId = id;
  localStorage.setItem("wallProjectActive", id);

  // Reset to start screen
  state.img = null;
  state.imageDataUrl = null;
  state.originalData = null;
  state.maskData = null;
  state.zones = [
    { name: "Zone 1", color: "#D1CBC1" },
    { name: "Zone 2", color: "#CDD2CA" },
  ];
  state.activeZone = 0;
  state.undoStack = [];
  state.redoStack = [];
  updateUndoButtons();
  renderZoneList();
  renderProjectSelect();
  els.startScreen.classList.remove("hidden");
}

// ===== DELETE PROJECT =====
export async function deleteProject(id) {
  if (!confirm("Delete this project? This cannot be undone.")) return;

  let list = getProjectList();
  list = list.filter((p) => p.id !== id);
  saveProjectList(list);
  try {
    await deleteProjectData(id);
  } catch (err) {
    console.error("Failed to delete project data:", err);
  }

  if (state.currentProjectId === id) {
    state.currentProjectId = null;
    if (list.length > 0) {
      await switchProject(list[0].id);
    }
    renderProjectSelect();
    if (!state.currentProjectId) {
      // No projects left or switchProject failed — reset
      state.img = null;
      state.imageDataUrl = null;
      state.originalData = null;
      state.maskData = null;
      state.zones = [
        { name: "Zone 1", color: "#D1CBC1" },
        { name: "Zone 2", color: "#CDD2CA" },
      ];
      state.activeZone = 0;
      state.undoStack = [];
      state.redoStack = [];
      updateUndoButtons();
      renderZoneList();
      renderProjectSelect();
      localStorage.removeItem("wallProjectActive");
      els.startScreen.classList.remove("hidden");
    }
  } else {
    renderProjectSelect();
  }
}

// ===== RENAME PROJECT =====
export function renameProject(id, name) {
  const list = getProjectList();
  const entry = list.find((p) => p.id === id);
  if (entry) {
    entry.name = name;
    saveProjectList(list);
    renderProjectSelect();
  }
}

// ===== EXPORT / IMPORT =====
export function exportProject() {
  if (!state.img) return;
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

export function applyImportedMask(data) {
  if (data.width !== state.img.width || data.height !== state.img.height) {
    alert("Mask dimensions do not match current image.");
    return;
  }
  if (data.version === 2 || data.version === 3) {
    state.maskData = rlDecode(data.mask, state.img.width * state.img.height);
    if (data.zones) {
      state.zones = data.zones;
      state.activeZone = 0;
      renderZoneList();
    }
  }
  state.undoStack = [];
  state.redoStack = [];
  updateUndoButtons();
  render();
}

export function handleProjectOrMaskFile(file, createEntry = false) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.version === 3 && data.image) {
        if (createEntry) {
          // Import as a new project
          const name = file.name.replace(/\.json$/i, "") || "Imported Project";
          // Save current project first
          if (state.img && state.currentProjectId) {
            try {
              await dbSave(state.currentProjectId, getProjectPayload());
            } catch (err) {
              showSaveError(err);
            }
          }
          const id = generateId();
          const list = getProjectList();
          list.push({ id, name });
          saveProjectList(list);
          state.currentProjectId = id;
          localStorage.setItem("wallProjectActive", id);
          renderProjectSelect();
        }
        loadProjectV3(data);
      } else if (data.version === 2) {
        if (!state.img) {
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

export function importProject() {
  openFilePicker(".json", (file) => {
    handleProjectOrMaskFile(file, true);
    const btn = document.getElementById("importMask");
    btn.textContent = "Loaded!";
    setTimeout(() => {
      btn.textContent = "Import";
    }, 1500);
  });
}
