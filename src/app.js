import { initElements } from "./state.js";
import { renderZoneList, renderPresets } from "./zones.js";
import { renderProjectSelect, loadLastProject } from "./project.js";
import { setupStartScreen, setupEvents } from "./events.js";

async function init() {
  initElements();
  renderZoneList();
  renderPresets();
  renderProjectSelect();
  setupStartScreen();
  setupEvents();
  await loadLastProject();
}

init();
