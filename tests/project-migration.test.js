// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import "fake-indexeddb/auto";

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

const storageMap = new Map();
const storageMock = {
  getItem: (key) => storageMap.get(key) ?? null,
  setItem: (key, value) => storageMap.set(key, String(value)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};
Object.defineProperty(globalThis, "localStorage", { value: storageMock });

import { state, els } from "../src/state.js";
import { loadLastProject } from "../src/project.js";
import { loadProject as dbLoad, _resetDB } from "../src/db.js";

beforeEach(() => {
  storageMap.clear();
  vi.clearAllMocks();
  _resetDB();

  document.body.innerHTML = `
    <select id="projectSelect"></select>
    <div id="startScreen" class="hidden"></div>
  `;
  els.startScreen = document.getElementById("startScreen");

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
  _resetDB();
});

describe("localStorage → IndexedDB migration", () => {
  it("migrates legacy single-key wallProject to IndexedDB", async () => {
    const projectData = {
      version: 3,
      image: "data:image/png;base64,legacy",
      zones: [{ name: "Zone 1", color: "#FF0000" }],
      mask: [[0, 4]],
      width: 2,
      height: 2,
    };
    localStorage.setItem("wallProject", JSON.stringify(projectData));

    await loadLastProject();

    // Old key removed
    expect(localStorage.getItem("wallProject")).toBeNull();
    // Migration flag set
    expect(localStorage.getItem("wallProject_idb_migrated")).toBe("1");
    // Project list created
    const list = JSON.parse(localStorage.getItem("wallProjectList"));
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Project 1");
    // Data stored in IndexedDB
    const loaded = await dbLoad(list[0].id);
    expect(loaded).toEqual(projectData);
  });

  it("migrates multi-project localStorage data to IndexedDB", async () => {
    const proj1Data = {
      version: 3,
      image: "data:image/png;base64,a",
      zones: [{ name: "Zone 1", color: "#FF0000" }],
      mask: [[0, 4]],
    };
    const proj2Data = {
      version: 3,
      image: "data:image/png;base64,b",
      zones: [{ name: "Zone 1", color: "#00FF00" }],
      mask: [[0, 4]],
    };

    localStorage.setItem(
      "wallProjectList",
      JSON.stringify([
        { id: "p1", name: "Project 1" },
        { id: "p2", name: "Project 2" },
      ]),
    );
    localStorage.setItem("wallProject_p1", JSON.stringify(proj1Data));
    localStorage.setItem("wallProject_p2", JSON.stringify(proj2Data));
    localStorage.setItem("wallProjectActive", "p1");

    await loadLastProject();

    // localStorage project data removed
    expect(localStorage.getItem("wallProject_p1")).toBeNull();
    expect(localStorage.getItem("wallProject_p2")).toBeNull();
    // Migration flag set
    expect(localStorage.getItem("wallProject_idb_migrated")).toBe("1");
    // Metadata preserved in localStorage
    expect(localStorage.getItem("wallProjectList")).not.toBeNull();
    expect(localStorage.getItem("wallProjectActive")).toBe("p1");
    // Data in IndexedDB
    expect(await dbLoad("p1")).toEqual(proj1Data);
    expect(await dbLoad("p2")).toEqual(proj2Data);
  });

  it("skips migration when flag is already set", async () => {
    localStorage.setItem("wallProject_idb_migrated", "1");
    localStorage.setItem(
      "wallProjectList",
      JSON.stringify([{ id: "p1", name: "Project 1" }]),
    );
    // This localStorage key should NOT be read/migrated since flag is set
    localStorage.setItem(
      "wallProject_p1",
      JSON.stringify({ version: 3, image: "x" }),
    );
    localStorage.setItem("wallProjectActive", "p1");

    await loadLastProject();

    // Data should still be in localStorage (not migrated)
    expect(localStorage.getItem("wallProject_p1")).not.toBeNull();
    // But loadLastProject reads from IndexedDB, so it returns false (no IDB data)
    expect(state.currentProjectId).toBeNull();
  });

  it("handles empty project list gracefully", async () => {
    const result = await loadLastProject();
    expect(result).toBe(false);
    expect(localStorage.getItem("wallProject_idb_migrated")).toBe("1");
  });
});
