/**
 * Text-only menu shown after the password screen (#/menu).
 *
 * Lists `main` and every other branch of the GitHub repo. Branches are read
 * live from the GitHub API, so a newly pushed branch shows up without any
 * code change; its link is the Vercel deployment of the branch's latest commit,
 * as Vercel reported it back to GitHub. `main` links to the production site.
 *
 * Each entry links to the same two pages: the registration journey and the
 * payment widget. Links for the deployment you're on are relative.
 */

import { esc } from "../ui.js";
import { GITHUB_REPO, MAIN_BRANCH, PRODUCTION_URL } from "../config.js";

const API = `https://api.github.com/repos/${GITHUB_REPO}`;
const CACHE_KEY = "paymesh.menu.branches";
const CACHE_MS = 2 * 60 * 1000; // the unauthenticated GitHub API allows 60 calls an hour

const getJSON = async (url) => {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
};

/** Every branch except main, with the state and URL of its latest Vercel deployment. */
async function loadBranches() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.branches;
  } catch {
    /* no cache */
  }

  const heads = (await getJSON(`${API}/branches?per_page=100`)).filter((b) => b.name !== MAIN_BRANCH);

  // Vercel files each deployment under its commit, so look up the branch's latest commit.
  const branches = await Promise.all(
    heads.map(async ({ name, commit }) => {
      const [deployment] = await getJSON(`${API}/deployments?sha=${commit.sha}&per_page=1`);
      if (!deployment) return { name, state: "none" };
      const [status] = await getJSON(`${deployment.statuses_url}?per_page=1`);
      return { name, state: status?.state || "pending", url: status?.environment_url || null };
    })
  );

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), branches }));
  } catch {
    /* private browsing */
  }
  return branches;
}

/** Links into a deployment — relative when it's the one being viewed. */
function pageLinks(base) {
  const here = base && new URL(base).origin === location.origin;
  const at = (path) => (here ? path : `${base.replace(/\/$/, "")}/${path}`);
  return `
    <ul class="menu__links">
      <li><a href="${at("#/")}">Registration journey</a></li>
      <li><a href="${at("widget.html")}">Payment widget</a></li>
    </ul>`;
}

function branchEntry({ name, state, url }) {
  const body =
    state === "success" && url
      ? pageLinks(url)
      : `<p class="menu__note">${
          state === "none" ? "Not deployed yet." : state === "failure" || state === "error" ? "Deployment failed." : "Building…"
        }</p>`;
  return `<li class="menu__entry"><h3>${esc(name)}</h3>${body}</li>`;
}

export default {
  render() {
    return `
    <main class="menu">
      <h1>Paymesh prototypes</h1>

      <section>
        <h2>${esc(MAIN_BRANCH)}</h2>
        ${pageLinks(PRODUCTION_URL)}
      </section>

      <section>
        <h2>Branches</h2>
        <div data-branches><p class="menu__note">Loading branches…</p></div>
      </section>
    </main>`;
  },

  mount(root) {
    const box = root.querySelector("[data-branches]");
    let alive = true;

    loadBranches()
      .then((branches) => {
        if (!alive) return;
        box.innerHTML = branches.length
          ? `<ul class="menu__entries">${branches.map(branchEntry).join("")}</ul>`
          : `<p class="menu__note">No other branches yet.</p>`;
      })
      .catch(() => {
        if (alive) box.innerHTML = `<p class="menu__note">Couldn't load branches from GitHub. Try again in a few minutes.</p>`;
      });

    return { destroy: () => (alive = false) };
  },
};
