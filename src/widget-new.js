/**
 * Standalone page for the newest payment widget (widget-new.html), with its
 * three scenarios. Behind the same password screen.
 */

import { wireCommon } from "./ui.js";
import { requirePassword } from "./screens/gate.js";
import page from "./screens/widget-new.js";

const root = document.getElementById("root");
wireCommon(root);

await requirePassword(root);

root.innerHTML = page.render();
page.mount(root);
