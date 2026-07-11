import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../../package.json";
import { FLOW_CONTENT_SCRIPT_MATCHES, FLOW_HOST_PERMISSIONS } from "../shared/config/hosts";

const icons = {
  16: "icons/icon-16.png",
  32: "icons/icon-32.png",
  48: "icons/icon-48.png",
  128: "icons/icon-128.png",
};

export default defineManifest({
  manifest_version: 3,
  name: "MyFlow Studio",
  short_name: "MyFlow Studio",
  description: "Automate Google Flow image generation from a queue of prompts.",
  version: pkg.version,
  icons,
  action: {
    default_popup: "src/ui/popup/index.html",
    default_icon: icons,
  },
  side_panel: {
    default_path: "src/ui/sidepanel/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: [...FLOW_CONTENT_SCRIPT_MATCHES],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "downloads", "alarms", "sidePanel", "offscreen", "tabs"],
  host_permissions: [...FLOW_HOST_PERMISSIONS],
  minimum_chrome_version: "116",
});
