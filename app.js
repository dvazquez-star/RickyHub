import { catalog } from "./data.js";

const state = {
  filter: "all",
  heroId: null,
  myList: new Set()
};

const $ = (sel) => document.querySelector(sel);

const heroEl = $("#hero");
const heroTagEl = $("#heroTag");
const heroTitleEl = $("#heroTitle");
const heroDescEl = $("#heroDesc");
const heroPlayBtn = $("#heroPlayBtn");
const heroInfoBtn = $("#heroInfoBtn");

const gridEl = $("#grid");
const navButtons = document.querySelectorAll(".rf-nav-item");

const modalBackdrop = $("#modalBackdrop");
const modalCloseBtn = $("#modalCloseBtn");
const modalHero = $("#modalHero");
const modalType = $("#modalType");
const modalYear = $("#modalYear");
const modalRating = $("#modalRating");
const modalTitle = $("#modalTitle");
const modalDesc = $("#modalDesc");
const modalPlayBtn = $("#modalPlayBtn");
const modalMyListBtn = $("#modalMyListBtn");

const toastEl = $("#toast");

// Player elements
const playerBackdrop = $("#playerBackdrop");
const playerCloseBtn = $("#playerCloseBtn");
const playerVideo = $("#playerVideo");
const playerTitle = $("#playerTitle");

function init() {
  state.heroId = catalog[0]?.id ?? null;
  renderHero();
  renderGrid();
  setupEvents();
}

function filteredCatalog() {
  if (state.filter === "all") return catalog;
  if (state.filter === "series") return catalog.filter((i) => i.type === "serie");
  if (state.filter === "peliculas") return catalog.filter((i) => i.type === "pelicula");
  if (state.filter === "mi-lista") {
    return catalog.filter((i) => state.myList.has(i.id));
  }
  return catalog;
}

function renderHero() {
  const heroItem = catalog.find((i) => i.id === state.heroId) ?? catalog[0];
  if (!heroItem) return;

  heroEl.style.backgroundImage = heroItem.heroImage;
  heroTagEl.textContent = heroItem.tag || (heroItem.type === "serie" ? "Serie" : "Película");
  heroTitleEl.textContent = heroItem.title;
  heroDescEl.textContent = heroItem.description;

  heroPlayBtn.onclick = () => playItem(heroItem);
  heroInfoBtn.onclick = () => openModal(heroItem);
}

function renderGrid() {
  const items = filteredCatalog();
  gridEl.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.style.gridColumn = "1 / -1";
    empty.style.display = "flex";
    empty.style.alignItems = "center";
    empty.style.justifyContent = "center";
    empty.style.fontSize = "12px";
    empty.style.color = "var(--rf-text-muted)";
    empty.textContent = "Todavía no hay nada aquí.";
    gridEl.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "rf-card";
    card.dataset.id = item.id;

    const bg = document.createElement("div");
    bg.className = "rf-card-bg";
    bg.style.backgroundImage = item.accent;

    const overlay = document.createElement("div");
    overlay.className = "rf-card-overlay";

    const content = document.createElement("div");
    content.className = "rf-card-content";

    const topRow = document.createElement("div");
    topRow.className = "rf-card-badge-row";

    const badge = document.createElement("span");
    badge.className = "rf-card-badge";
    badge.textContent = item.type === "serie" ? "SERIE" : "PELÍCULA";

    const rating = document.createElement("span");
    rating.className = "rf-card-rating";
    rating.textContent = item.rating;

    topRow.appendChild(badge);
    topRow.appendChild(rating);

    const title = document.createElement("h3");
    title.className = "rf-card-title";
    title.textContent = item.title;

    content.appendChild(topRow);
    content.appendChild(title);

    card.appendChild(bg);
    card.appendChild(overlay);
    card.appendChild(content);

    card.addEventListener("click", () => {
      state.heroId = item.id;
      renderHero();
      openModal(item);
    });

    gridEl.appendChild(card);
  }
}

function setupEvents() {
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      if (!filter || state.filter === filter) return;
      state.filter = filter;
      navButtons.forEach((b) => b.classList.remove("rf-nav-item--active"));
      btn.classList.add("rf-nav-item--active");
      renderGrid();
    });
  });

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  modalCloseBtn.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!playerBackdrop.hidden) {
        closePlayer();
      } else if (!modalBackdrop.hidden) {
        closeModal();
      }
    }
  });

  // Player events
  playerBackdrop.addEventListener("click", (e) => {
    if (e.target === playerBackdrop) closePlayer();
  });

  playerCloseBtn.addEventListener("click", closePlayer);
}

function openModal(item) {
  modalHero.style.backgroundImage = item.heroImage;
  modalType.textContent = item.type === "serie" ? "Serie" : "Película";
  modalYear.textContent = item.year;
  modalRating.textContent = item.rating;
  modalTitle.textContent = item.title;
  modalDesc.textContent = item.description;

  modalPlayBtn.onclick = () => playItem(item);
  updateMyListButton(item.id);
  modalMyListBtn.onclick = () => toggleMyList(item);

  modalBackdrop.hidden = false;
}

function closeModal() {
  modalBackdrop.hidden = true;
}

function playItem(item) {
  openPlayer(item);
}

function openPlayer(item) {
  if (!item.videoUrl) {
    showToast(`No hay video disponible para "${item.title}"`);
    return;
  }

  playerTitle.textContent = item.title;
  playerVideo.src = item.videoUrl;
  playerVideo.currentTime = 0;
  playerVideo.play().catch(() => {
    // Autoplay puede fallar en móvil; el usuario aún puede darle play manualmente
  });

  playerBackdrop.hidden = false;
}

function closePlayer() {
  playerBackdrop.hidden = true;
  if (playerVideo) {
    playerVideo.pause();
    playerVideo.src = "";
  }
}

function toggleMyList(item) {
  const isInList = state.myList.has(item.id);
  if (isInList) {
    state.myList.delete(item.id);
    showToast(`Quitado de Mi lista: "${item.title}"`);
  } else {
    state.myList.add(item.id);
    showToast(`Añadido a Mi lista: "${item.title}"`);
  }
  updateMyListButton(item.id);
  if (state.filter === "mi-lista") renderGrid();
}

function updateMyListButton(id) {
  const isInList = state.myList.has(id);
  modalMyListBtn.textContent = isInList ? " En mi lista" : " Mi lista";
}

let toastTimeout = null;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add("rf-toast--visible");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("rf-toast--visible");
    setTimeout(() => {
      toastEl.hidden = true;
    }, 220);
  }, 1300);
}

document.addEventListener("DOMContentLoaded", init);