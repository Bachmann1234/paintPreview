// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import "fake-indexeddb/auto";

// Mock render and related modules before importing project
vi.mock("../src/render.js", () => ({
  render: vi.fn(),
}));
vi.mock("../src/masks.js", () => ({
  updateUndoButtons: vi.fn(),
  showHint: vi.fn(),
}));
vi.mock("../src/zones.js", () => ({
  renderZoneList: vi.fn(),
}));
vi.mock("../src/events.js", () => ({
  resetZoom: vi.fn(),
  setView: vi.fn(),
}));

// Provide a working localStorage mock for happy-dom
const storageMap = new Map();
const storageMock = {
  getItem: (key) => storageMap.get(key) ?? null,
  setItem: (key, value) => storageMap.set(key, String(value)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};
Object.defineProperty(globalThis, "localStorage", { value: storageMock });

import { state, els } from "../src/state.js";
import {
  deleteProject,
  renderProjectSelect,
  scheduleAutoSave,
} from "../src/project.js";
import {
  saveProject as dbSave,
  loadProject as dbLoad,
  _resetDB,
} from "../src/db.js";

beforeEach(async () => {
  storageMap.clear();
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  _resetDB();

  // Set up minimal DOM
  document.body.innerHTML = `
    <select id="projectSelect"></select>
    <div id="startScreen" class="hidden"></div>
  `;
  els.startScreen = document.getElementById("startScreen");

  // Reset state
  state.currentProjectId = null;
  state.img = null;
  state.imageDataUrl = null;
  state.originalData = null;
  state.maskData = null;
  state.zones = [{ name: "Zone 1", color: "#D1CBC1" }];
  state.activeZone = 0;
  state.undoStack = [];
  state.redoStack = [];
});

afterEach(() => {
  vi.useRealTimers();
  _resetDB();
});

async function setupTwoProjects() {
  const projects = [
    { id: "proj1", name: "Project 1" },
    { id: "proj2", name: "Project 2" },
  ];
  localStorage.setItem("wallProjectList", JSON.stringify(projects));

  const proj1Data = {
    version: 3,
    image: "data:image/png;base64,x",
    zones: [{ name: "Zone 1", color: "#FF0000" }],
    mask: [[0, 4]],
  };
  const proj2Data = {
    version: 3,
    image: "data:image/png;base64,y",
    zones: [{ name: "Zone 1", color: "#00FF00" }],
    mask: [[0, 4]],
  };
  await dbSave("proj1", proj1Data);
  await dbSave("proj2", proj2Data);
  localStorage.setItem("wallProjectActive", "proj1");

  state.currentProjectId = "proj1";
  state.img = { width: 2, height: 2 };
  state.imageDataUrl = "data:image/png;base64,x";
  state.maskData = new Uint8Array(4);

  renderProjectSelect();
}

function getDropdownOptions() {
  const sel = document.getElementById("projectSelect");
  return Array.from(sel.options).map((o) => ({
    value: o.value,
    text: o.textContent,
  }));
}

describe("deleteProject", () => {
  it("removes project from dropdown when deleting current project", async () => {
    await setupTwoProjects();

    // Confirm dialog returns true
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const before = getDropdownOptions();
    expect(before).toEqual([
      { value: "proj1", text: "Project 1" },
      { value: "proj2", text: "Project 2" },
      { value: "__new__", text: "+ New Project..." },
    ]);

    await deleteProject("proj1");

    const after = getDropdownOptions();
    expect(after).toEqual([
      { value: "proj2", text: "Project 2" },
      { value: "__new__", text: "+ New Project..." },
    ]);
  });

  it("removes project data from IndexedDB and localStorage list", async () => {
    await setupTwoProjects();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await deleteProject("proj1");

    expect(await dbLoad("proj1")).toBeUndefined();

    const list = JSON.parse(localStorage.getItem("wallProjectList"));
    expect(list).toEqual([{ id: "proj2", name: "Project 2" }]);
  });

  it("does not re-save deleted project data via switchProject", async () => {
    await setupTwoProjects();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await deleteProject("proj1");

    // The deleted project's data should NOT be re-saved
    expect(await dbLoad("proj1")).toBeUndefined();
  });

  it("does not re-create deleted project via auto-save", async () => {
    await setupTwoProjects();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await deleteProject("proj1");

    // Fast-forward past auto-save timer
    await vi.advanceTimersByTimeAsync(2000);

    // The project list should still only contain proj2
    const list = JSON.parse(localStorage.getItem("wallProjectList"));
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("proj2");

    // Dropdown should still be correct
    const options = getDropdownOptions();
    expect(options).toEqual([
      { value: "proj2", text: "Project 2" },
      { value: "__new__", text: "+ New Project..." },
    ]);
  });

  it("scheduleAutoSave after delete does not resurrect deleted project", async () => {
    await setupTwoProjects();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await deleteProject("proj1");

    // Simulate what happens when render() triggers scheduleAutoSave
    // after the deletion (e.g. from loadProjectV3's onload)
    scheduleAutoSave();
    await vi.advanceTimersByTimeAsync(2000);

    const list = JSON.parse(localStorage.getItem("wallProjectList"));
    const options = getDropdownOptions();

    // proj1 should NOT reappear
    expect(list.find((p) => p.id === "proj1")).toBeUndefined();
    expect(options.find((o) => o.text === "Project 1")).toBeUndefined();
  });

  it("resets state when switchProject fails (missing data)", async () => {
    await setupTwoProjects();
    // Remove proj2's data so switchProject will fail when falling back to it
    const { deleteProjectData } = await import("../src/db.js");
    await deleteProjectData("proj2");

    vi.spyOn(window, "confirm").mockReturnValue(true);

    await deleteProject("proj1");

    // Dropdown should still update (not show stale proj1)
    const options = getDropdownOptions();
    expect(options.find((o) => o.text === "Project 1")).toBeUndefined();

    // state.img should be cleared to prevent auto-save ghost projects
    expect(state.img).toBeNull();
    expect(state.currentProjectId).toBe("proj2");

    // Start screen should appear since switchProject failed
    expect(
      document.getElementById("startScreen").classList.contains("hidden"),
    ).toBe(false);

    // Auto-save should NOT create a ghost project
    await vi.advanceTimersByTimeAsync(2000);
    const list = JSON.parse(storageMap.get("wallProjectList") || "[]");
    expect(list.find((p) => p.name === "Project 1")).toBeUndefined();
  });

  it("shows start screen when deleting the last project", async () => {
    // Set up single project
    localStorage.setItem(
      "wallProjectList",
      JSON.stringify([{ id: "only", name: "Only Project" }]),
    );
    await dbSave("only", {
      version: 3,
      image: "data:image/png;base64,x",
      zones: [{ name: "Zone 1", color: "#FF0000" }],
      mask: [[0, 4]],
    });
    state.currentProjectId = "only";
    state.img = { width: 2, height: 2 };
    renderProjectSelect();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    await deleteProject("only");

    expect(
      document.getElementById("startScreen").classList.contains("hidden"),
    ).toBe(false);
    expect(state.currentProjectId).toBeNull();
    expect(state.img).toBeNull();

    const options = getDropdownOptions();
    expect(options).toEqual([{ value: "__new__", text: "+ New Project..." }]);
  });
});
