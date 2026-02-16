import { state, els, PRESETS } from "./state.js";
import { render } from "./render.js";
import { scheduleAutoSave } from "./project.js";
import { closeSidebarIfMobile } from "./events.js";

export function renderZoneList() {
  const container = document.getElementById("zoneList");
  container.innerHTML = "";
  state.zones.forEach((z, i) => {
    const div = document.createElement("div");
    div.className = "zone-entry" + (i === state.activeZone ? " active" : "");
    div.innerHTML = `
      <div class="zone-swatch" style="background:${z.color}" data-idx="${i}"></div>
      <div class="zone-info">
        <div class="zone-name">${z.name}</div>
        <div class="zone-hex">${z.color}</div>
      </div>
      <button class="color-pick-btn" data-idx="${i}" title="Pick color">&#9998;</button>
      ${state.zones.length > 1 ? `<button class="remove-btn" data-idx="${i}">&times;</button>` : ""}
    `;

    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) {
        removeZone(i);
        return;
      }
      if (
        e.target.classList.contains("zone-swatch") ||
        e.target.classList.contains("color-pick-btn")
      ) {
        pickZoneColor(i);
        return;
      }
      state.activeZone = i;
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
  scheduleAutoSave();
}

function pickZoneColor(idx) {
  const picker = document.createElement("input");
  picker.type = "color";
  picker.value = state.zones[idx].color;
  picker.addEventListener("input", (e) => {
    state.zones[idx].color = e.target.value.toUpperCase();
    renderZoneList();
    render();
  });
  picker.click();
}

function removeZone(idx) {
  if (state.zones.length <= 1) return;
  const removedZoneVal = idx + 1;
  state.zones.splice(idx, 1);

  const len = state.maskData.length;
  for (let i = 0; i < len; i++) {
    if (state.maskData[i] === removedZoneVal) {
      state.maskData[i] = 0;
    } else if (state.maskData[i] > removedZoneVal) {
      state.maskData[i]--;
    }
  }

  if (state.activeZone >= state.zones.length)
    state.activeZone = state.zones.length - 1;
  renderZoneList();
  render();
}

export function renderPresets(filter = "") {
  const grid = document.getElementById("presetGrid");
  grid.innerHTML = "";
  const query = filter.toLowerCase();
  const filtered = query
    ? PRESETS.filter((p) => p.name.toLowerCase().includes(query))
    : PRESETS;
  filtered.forEach((p) => {
    const div = document.createElement("div");
    div.className = "preset-swatch";
    div.style.background = p.hex;
    div.title = p.name;
    div.addEventListener("click", () => {
      state.zones[state.activeZone].color = p.hex;
      state.zones[state.activeZone].name = p.name;
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
      els.tooltip.textContent = `${p.name} (${p.hex})`;
      els.tooltip.style.display = "block";
      els.tooltip.style.left = e.clientX + 12 + "px";
      els.tooltip.style.top = e.clientY - 28 + "px";
    });
    div.addEventListener("mouseleave", () => {
      els.tooltip.style.display = "none";
    });
    grid.appendChild(div);
  });
}
