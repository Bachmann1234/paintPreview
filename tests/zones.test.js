// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../src/render.js", () => ({
  render: vi.fn(),
}));
vi.mock("../src/project.js", () => ({
  scheduleAutoSave: vi.fn(),
}));
vi.mock("../src/events.js", () => ({
  closeSidebarIfMobile: vi.fn(),
}));

import { state } from "../src/state.js";
import { removeZone, renderZoneList } from "../src/zones.js";

function resetState() {
  state.img = { width: 10, height: 10 };
  state.maskData = new Uint8Array(100);
  state.zones = [
    { name: "Zone 1", color: "#FF0000" },
    { name: "Zone 2", color: "#00FF00" },
    { name: "Zone 3", color: "#0000FF" },
  ];
  state.activeZone = 0;
}

beforeEach(() => {
  resetState();

  document.body.innerHTML = `
    <div id="zoneList"></div>
    <div id="presetGrid"></div>
  `;

  vi.clearAllMocks();
});

// ===== removeZone =====
describe("removeZone", () => {
  it("clears mask pixels belonging to removed zone", () => {
    state.maskData[0] = 2; // Zone 2 (idx 1)
    state.maskData[1] = 1; // Zone 1 (idx 0)
    state.maskData[2] = 3; // Zone 3 (idx 2)

    removeZone(1); // Remove Zone 2 (val=2)
    expect(state.maskData[0]).toBe(0); // Was zone 2, now cleared
  });

  it("decrements mask values above removed zone", () => {
    state.maskData[0] = 3; // Zone 3 (val=3)
    state.maskData[1] = 1; // Zone 1 (val=1)

    removeZone(1); // Remove Zone 2 (val=2)
    expect(state.maskData[0]).toBe(2); // Was 3, now 2
    expect(state.maskData[1]).toBe(1); // Was 1, stays 1
  });

  it("splices the zone from the array", () => {
    removeZone(1);
    expect(state.zones.length).toBe(2);
    expect(state.zones[0].name).toBe("Zone 1");
    expect(state.zones[1].name).toBe("Zone 3");
  });

  it("clamps activeZone if beyond bounds", () => {
    state.activeZone = 2;
    removeZone(2); // Remove last zone
    expect(state.activeZone).toBe(1); // zones.length - 1
  });

  it("refuses to remove when only one zone", () => {
    state.zones = [{ name: "Zone 1", color: "#FF0000" }];
    state.maskData[0] = 1;
    removeZone(0);
    expect(state.zones.length).toBe(1);
    expect(state.maskData[0]).toBe(1); // Unchanged
  });

  it("handles removing first zone", () => {
    state.maskData[0] = 1; // Zone 1
    state.maskData[1] = 2; // Zone 2
    state.maskData[2] = 3; // Zone 3

    removeZone(0);
    expect(state.maskData[0]).toBe(0); // Was zone 1, cleared
    expect(state.maskData[1]).toBe(1); // Was 2, now 1
    expect(state.maskData[2]).toBe(2); // Was 3, now 2
    expect(state.zones.length).toBe(2);
  });

  it("handles removing last zone in list", () => {
    state.maskData[0] = 3; // Zone 3
    state.maskData[1] = 1;

    removeZone(2);
    expect(state.maskData[0]).toBe(0); // Was zone 3 (val=3), cleared
    expect(state.maskData[1]).toBe(1); // Was zone 1, stays
    expect(state.zones.length).toBe(2);
  });

  it("keeps activeZone in bounds when removing active", () => {
    state.activeZone = 1;
    removeZone(1);
    expect(state.activeZone).toBeLessThan(state.zones.length);
  });
});

// ===== renderZoneList =====
describe("renderZoneList", () => {
  it("renders correct number of zone entries", () => {
    renderZoneList();
    const entries = document.querySelectorAll(".zone-entry");
    expect(entries.length).toBe(3);
  });

  it("marks active zone with active class", () => {
    state.activeZone = 1;
    renderZoneList();
    const entries = document.querySelectorAll(".zone-entry");
    expect(entries[0].classList.contains("active")).toBe(false);
    expect(entries[1].classList.contains("active")).toBe(true);
    expect(entries[2].classList.contains("active")).toBe(false);
  });

  it("shows remove button when multiple zones", () => {
    renderZoneList();
    const removeBtns = document.querySelectorAll(".remove-btn");
    expect(removeBtns.length).toBe(3);
  });

  it("hides remove button for single zone", () => {
    state.zones = [{ name: "Zone 1", color: "#FF0000" }];
    renderZoneList();
    const removeBtns = document.querySelectorAll(".remove-btn");
    expect(removeBtns.length).toBe(0);
  });
});
