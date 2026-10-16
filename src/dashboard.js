/**
 * Standalone page for the wallet dashboard (dashboard.html). Behind the same
 * password screen.
 */

import { wireCommon } from "./ui.js";
import { requirePassword } from "./screens/gate.js";
import page from "./screens/dashboard.js";

const root = document.getElementById("root");
wireCommon(root);

await requirePassword(root);

page.mount(root);
