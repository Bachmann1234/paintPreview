import { initElements } from "./state.js";
import { renderZoneList, renderPresets } from "./zones.js";
import { renderProjectSelect, loadLastProject } from "./project.js";
import { setupStartScreen, setupEvents } from "./events.js";

function init() {
  initElements();
  renderZoneList();
  renderPresets();
  renderProjectSelect();
  setupStartScreen();
  setupEvents();
  loadLastProject();
}

init();
