/**
 * Standalone page for the split-payment widget (widget.html) — just the
 * widget on white, outside the journeys. Behind the same password screen.
 */

import { wireCommon } from "./ui.js";
import { requirePassword } from "./screens/gate.js";
import widget from "./screens/v2/split-widget.js";

const root = document.getElementById("root");
wireCommon(root);

await requirePassword(root);

root.innerHTML = widget.render();
widget.mount(root);
