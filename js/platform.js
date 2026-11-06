import { client } from "./api.js";
import { modules, legacyModuleTarget } from "./modules.js";
import { escapeHtml as esc } from "./domain.js";

const iconFor = (id) => {
  const icons = {
    "prof-jana-galeh": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 34h32M12 34V17l12-7 12 7v17M18 34V24h12v10M20 18h8" /></svg>',
    ege: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 13h12l4 4h16v19H8zM12 23h24M16 29h16" /></svg>',
    "mon-bac": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10h12a7 7 0 0 1 7 7v24a9 9 0 0 0-9-5H8zM40 10H28a7 7 0 0 0-7 7v24a9 9 0 0 1 9-5h10z" /></svg>',
  };
  return icons[id] || '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="14" /><path d="M24 16v16M16 24h16" /></svg>';
};
const redirect = legacyModuleTarget(location.hash);
if (redirect) {
  location.replace(redirect);
} else {
  const grid = document.getElementById("applicationGrid");
  const future = grid.querySelector(".future-panel");
  const available = modules.filter((module) => module.status === "available");
  for (const module of available) {
    let card = [...grid.querySelectorAll("[data-module]")].find((node) => node.dataset.module === module.id);
    if (!card) {
      card = document.createElement("article");
      card.className = "application-card";
      card.dataset.module = module.id;
      card.innerHTML = `<div class="app-visual app-visual-${esc(module.id)}"><span class="module-icon" aria-hidden="true">${iconFor(module.id)}</span><span class="availability"><span></span>Disponible</span><span class="app-visual-arrow">↗</span></div><div class="application-content"><p class="app-category">${esc(module.category)}</p><h3>${esc(module.name)}</h3><p>${esc(module.description)}</p><div class="app-tags">${(module.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div></div><div class="app-card-bottom"><a class="app-launch" href="${esc(module.entry)}"><span>Ouvrir ${esc(module.name)}</span><span aria-hidden="true">↗</span></a><span class="module-note">Application JanaGaleh</span></div>`;
      grid.insertBefore(card, future);
    }
    card.querySelector(".app-launch").setAttribute("href", module.entry);
  }
  if (available.length > 1) future.hidden = true;
  let revision = 0;
  const label = document.getElementById("platformAccountLabel");
  const launch = document.getElementById("launchMonBac");
  function reset() {
    label.textContent = "Se connecter";
    launch.querySelector("span").textContent = "Ouvrir MON BAC";
  }
  async function account() {
    const current = ++revision;
    try {
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) {
        if (current === revision) reset();
        return;
      }
      if (current !== revision) return;
      label.textContent = "Mon compte";
      launch.querySelector("span").textContent = "Retrouver mon espace";
    } catch {
      if (current === revision) reset();
    }
  }
  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      revision++;
      reset();
    }
  });
  account();
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}
