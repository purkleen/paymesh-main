/**
 * Compliance template editor — intro slide with a section builder.
 *
 * "+ Dodaj sekcję" opens a menu that adds a text, image, video or
 * labelled-input section. Sections reorder by dragging their handle
 * (or with Alt+↑/↓ from the keyboard) and show a delete button to their
 * right on hover. The layout persists in localStorage.
 */

/* ---------- Icons (lucide, the set shadcn/ui and the Figma file use) ---------- */
const ICONS = {
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  "grip-vertical":
    '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  "trash-2":
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  "text-cursor-input":
    '<path d="M5 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1"/><path d="M13 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H5"/><path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1"/><path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7"/><path d="M9 7v10"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
};

const icon = (name, size = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const svg = icon(el.dataset.icon, Number(el.dataset.size) || 16);
    if (el.tagName === "SPAN") el.outerHTML = svg.replace("<svg ", `<svg class="${el.className}" `);
    else el.innerHTML = svg;
  });
}

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------- State ---------- */
const STORAGE_KEY = "compliance-intro-sections";
const LABELS = { text: "Tekst", image: "Obraz", video: "Wideo", input: "Pole z etykietą" };

let sections = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const saveState = document.getElementById("save-state");
let saveTimer;
function save() {
  saveState.textContent = "Zapisywanie…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      // Uploaded files live as object URLs for this visit only; keep their slot empty on reload.
      const persistable = sections.map((s) => (s.src?.startsWith("blob:") ? { ...s, src: "" } : s));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      /* storage unavailable — the editor still works for this visit */
    }
    saveState.textContent = "Zapisano";
  }, 400);
}

const uid = () => Math.random().toString(36).slice(2, 10);

function createSection(type) {
  const base = { id: uid(), type };
  if (type === "text") return { ...base, text: "" };
  if (type === "input") return { ...base, label: "Etykieta", placeholder: "Wpisz odpowiedź" };
  return { ...base, src: "" };
}

/* ---------- Rendering ---------- */
const list = document.getElementById("sections");

function sectionBody(s) {
  switch (s.type) {
    case "text":
      return `<p class="section-text" contenteditable="true" data-field="text" data-placeholder="Wpisz tekst…">${esc(s.text)}</p>`;
    case "input":
      return `<label class="field">
          <span class="field-label" contenteditable="true" data-field="label" data-placeholder="Etykieta">${esc(s.label)}</span>
          <input class="input" type="text" data-field="placeholder" placeholder="${esc(s.placeholder)}" aria-label="${esc(s.label)}" />
        </label>`;
    case "image":
    case "video":
      return s.src ? mediaFilled(s) : mediaEmpty(s);
  }
  return "";
}

function mediaEmpty(s) {
  const isVideo = s.type === "video";
  return `<div class="media-empty" data-dropzone>
      ${icon(isVideo ? "video" : "image", 24)}
      <div class="media-actions">
        <label class="btn btn-outline">
          ${icon("upload")}${isVideo ? "Wgraj wideo" : "Wgraj obraz"}
          <input type="file" accept="${isVideo ? "video/*" : "image/*"}" data-file hidden />
        </label>
      </div>
      <form class="media-url" data-url-form>
        <input class="input" type="url" name="url" placeholder="${isVideo ? "lub wklej link (YouTube, Vimeo, .mp4)" : "lub wklej link do obrazu"}" aria-label="Adres URL" />
        <button class="btn btn-outline" type="submit">Dodaj</button>
      </form>
    </div>`;
}

function embedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function mediaFilled(s) {
  let media;
  if (s.type === "image") media = `<img src="${esc(s.src)}" alt="" />`;
  else {
    const embed = embedUrl(s.src);
    media = embed
      ? `<iframe src="${esc(embed)}" title="Wideo" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${esc(s.src)}" controls playsinline></video>`;
  }
  return `<div class="media">${media}</div>
    <button class="btn btn-ghost media-replace" type="button" data-action="replace">Zmień ${s.type === "image" ? "obraz" : "wideo"}</button>`;
}

function renderSection(s) {
  const li = document.createElement("li");
  li.className = "section";
  li.dataset.id = s.id;
  li.innerHTML = `
    <button class="section-handle" type="button" draggable="true" aria-label="Przeciągnij, aby zmienić kolejność (${LABELS[s.type]})" title="Przeciągnij · Alt+↑/↓">${icon("grip-vertical")}</button>
    <div class="section-body">${sectionBody(s)}</div>
    <button class="btn btn-ghost btn-icon section-delete" type="button" data-action="delete" aria-label="Usuń sekcję: ${LABELS[s.type]}" title="Usuń">${icon("trash-2")}</button>`;
  return li;
}

function render() {
  list.replaceChildren(...sections.map(renderSection));
}

function rerenderOne(id) {
  const s = sections.find((x) => x.id === id);
  const old = list.querySelector(`[data-id="${id}"]`);
  if (s && old) old.replaceWith(renderSection(s));
}

/* ---------- Add-section dropdown ---------- */
const addBtn = document.getElementById("add-section");
const menu = document.getElementById("add-menu");

function setMenu(open) {
  menu.hidden = !open;
  addBtn.setAttribute("aria-expanded", String(open));
  if (!open) return;
  // Open upward when there isn't room below the button.
  menu.classList.remove("is-up");
  const below = window.innerHeight - addBtn.getBoundingClientRect().bottom;
  if (below < menu.offsetHeight + 12) menu.classList.add("is-up");
  menu.querySelector(".menu-item")?.focus({ preventScroll: true });
}

addBtn.addEventListener("click", () => setMenu(menu.hidden));

menu.addEventListener("click", (e) => {
  const item = e.target.closest("[data-type]");
  if (!item) return;
  const s = createSection(item.dataset.type);
  sections.push(s);
  list.append(renderSection(s));
  setMenu(false);
  save();
  list.querySelector(`[data-id="${s.id}"] [contenteditable], [data-id="${s.id}"] input[type=url]`)?.focus();
});

menu.addEventListener("keydown", (e) => {
  const items = [...menu.querySelectorAll(".menu-item")];
  const i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  if (e.key === "Escape") { setMenu(false); addBtn.focus(); }
});

document.addEventListener("click", (e) => {
  if (!menu.hidden && !e.target.closest(".add-section")) setMenu(false);
});

/* ---------- Editing ---------- */
const find = (el) => sections.find((s) => s.id === el.closest(".section")?.dataset.id);

list.addEventListener("input", (e) => {
  const field = e.target.dataset.field;
  const s = find(e.target);
  if (!s || !field || field === "placeholder") return;
  s[field] = e.target.textContent;
  if (field === "label") e.target.closest(".field").querySelector("input").setAttribute("aria-label", s.label);
  save();
});

list.addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  const s = find(e.target);
  if (!s || !action) return;
  if (action === "delete") {
    const li = e.target.closest(".section");
    const next = li.nextElementSibling || li.previousElementSibling;
    sections = sections.filter((x) => x !== s);
    li.remove();
    (next?.querySelector(".section-handle") || addBtn).focus();
    save();
  }
  if (action === "replace") {
    s.src = "";
    rerenderOne(s.id);
    save();
  }
});

function setMediaFile(s, file) {
  if (!file || !file.type.startsWith(s.type === "image" ? "image/" : "video/")) return;
  s.src = URL.createObjectURL(file);
  rerenderOne(s.id);
  save();
}

list.addEventListener("change", (e) => {
  if (!e.target.matches("[data-file]")) return;
  const s = find(e.target);
  if (s) setMediaFile(s, e.target.files[0]);
});

list.addEventListener("submit", (e) => {
  if (!e.target.matches("[data-url-form]")) return;
  e.preventDefault();
  const s = find(e.target);
  const url = e.target.url.value.trim();
  if (!s || !/^https?:\/\//i.test(url)) return;
  s.src = url;
  rerenderOne(s.id);
  save();
});

/* Dropping a file straight onto an empty image/video slot */
list.addEventListener("dragover", (e) => {
  const zone = e.target.closest("[data-dropzone]");
  if (zone && e.dataTransfer.types.includes("Files")) {
    e.preventDefault();
    zone.classList.add("is-over");
  }
});
list.addEventListener("dragleave", (e) => e.target.closest?.("[data-dropzone]")?.classList.remove("is-over"));

/* ---------- Drag & drop reordering ---------- */
let dragged = null;

list.addEventListener("dragstart", (e) => {
  const handle = e.target.closest?.(".section-handle");
  if (!handle) return;
  dragged = handle.closest(".section");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragged.dataset.id);
  e.dataTransfer.setDragImage(dragged, 16, 16);
  requestAnimationFrame(() => dragged?.classList.add("is-dragging"));
});

function clearIndicators() {
  list.querySelectorAll(".drop-before, .drop-after").forEach((el) => el.classList.remove("drop-before", "drop-after"));
}

function dropTarget(e) {
  const over = e.target.closest?.(".section");
  if (!over || over === dragged) return null;
  const r = over.getBoundingClientRect();
  return { el: over, before: e.clientY < r.top + r.height / 2 };
}

list.addEventListener("dragover", (e) => {
  if (!dragged) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  clearIndicators();
  const t = dropTarget(e);
  if (t) t.el.classList.add(t.before ? "drop-before" : "drop-after");
});

list.addEventListener("drop", (e) => {
  e.preventDefault();
  if (!dragged) {
    const zone = e.target.closest("[data-dropzone]");
    const s = zone && find(zone);
    if (s) setMediaFile(s, e.dataTransfer.files[0]);
    return;
  }
  const t = dropTarget(e);
  if (t) {
    t.el[t.before ? "before" : "after"](dragged);
    syncOrderFromDom();
  }
});

list.addEventListener("dragend", () => {
  dragged?.classList.remove("is-dragging");
  dragged = null;
  clearIndicators();
});

function syncOrderFromDom() {
  const order = [...list.children].map((li) => li.dataset.id);
  sections.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  save();
}

/* Keyboard reordering: Alt+↑ / Alt+↓ on the handle */
list.addEventListener("keydown", (e) => {
  if (!e.altKey || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
  const li = e.target.closest(".section");
  if (!li) return;
  e.preventDefault();
  const sibling = e.key === "ArrowUp" ? li.previousElementSibling : li.nextElementSibling;
  if (!sibling) return;
  sibling[e.key === "ArrowUp" ? "before" : "after"](li);
  syncOrderFromDom();
  e.target.focus();
});

/* ---------- Top bar: language tabs & theme ---------- */
document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
  })
);

const themeBtn = document.getElementById("theme-toggle");
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.innerHTML = icon(theme === "dark" ? "sun" : "moon");
}
let theme = "light";
try { theme = localStorage.getItem("compliance-theme") || "light"; } catch {}
themeBtn.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try { localStorage.setItem("compliance-theme", theme); } catch {}
});

/* ---------- Boot ---------- */
hydrateIcons();
applyTheme(theme);
render();
