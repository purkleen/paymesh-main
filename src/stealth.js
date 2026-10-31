/**
 * Standalone page for the Stealth Mode balance (stealth.html) — the 60fps
 * "Hide Sensitive Number Interaction" on white, the web counterpart of the
 * snippet's #Preview. Behind the same password screen.
 */

import { wireCommon } from "./ui.js";
import { requirePassword } from "./screens/gate.js";
import { HideSensitiveNumber } from "./components/hide-sensitive-number.js";

const root = document.getElementById("root");
wireCommon(root);

await requirePassword(root);

const page = document.createElement("main");
page.className = "hsn-page";
page.append(HideSensitiveNumber().el);
root.replaceChildren(page);
