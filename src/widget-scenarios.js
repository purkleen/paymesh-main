/**
 * Standalone page for the payment widget scenarios (widget-scenarios.html), with
 * every scenario and state. Behind the same password screen.
 */

import { wireCommon } from "./ui.js";
import { requirePassword } from "./screens/gate.js";
import page from "./screens/widget-scenarios.js";

const root = document.getElementById("root");
wireCommon(root);

await requirePassword(root);

root.innerHTML = page.render();
page.mount(root);
