// Landing + Explore (index.html) terhubung ke Firestore

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ---------- STATE & FIRESTORE ----------

const spotsColRef = collection(db, "spots");

let SPOTS = [];
let currentCategory = "All";
let hasLoadedSpots = false;

// ---------- DOM ELEMENTS ----------

const featuredContainer = document.getElementById("featuredSpots");
const spotsListContainer = document.getElementById("spotsList");
const spotsCountText = document.getElementById("spotsCountText");
const emptyState = document.getElementById("emptyState");

// Modal elements
const detailModal = document.getElementById("detailModal");
const detailModalOverlay = document.getElementById("detailModalOverlay");
const detailModalClose = document.getElementById("detailModalClose");

const detailImage = document.getElementById("detailImage");
const detailName = document.getElementById("detailName");
const detailCategory = document.getElementById("detailCategory");
const detailDistance = document.getElementById("detailDistance");
const detailLocation = document.getElementById("detailLocation");
const detailShortDescription = document.getElementById(
  "detailShortDescription"
);
const detailFullDescription = document.getElementById("detailFullDescription");

let currentDetailSpot = null;

// ---------- UTILS ----------

function formatDistance(meter) {
  if (meter == null || Number.isNaN(meter)) return "-";
  if (meter < 1000) {
    return `${meter} m`;
  }
  const km = meter / 1000;
  return `${km.toFixed(1)} km`;
}

function getCategoryIcon(category) {
  switch (category) {
    case "Makanan":
      return '<i class="ri-restaurant-2-line" aria-hidden="true"></i>';
    case "Kafe":
      return '<i class="ri-cup-line" aria-hidden="true"></i>';
    case "Belajar":
      return '<i class="ri-book-open-line" aria-hidden="true"></i>';
    case "Hiburan":
      return '<i class="ri-gamepad-line" aria-hidden="true"></i>';
    default:
      return '<i class="ri-map-pin-line" aria-hidden="true"></i>';
  }
}

function renderInitialLoading() {
  if (featuredContainer) {
    featuredContainer.innerHTML =
      '<p class="text-xs text-slate-500">Memuat pilihan terbaik...</p>';
  }
  if (spotsListContainer) {
    spotsListContainer.innerHTML =
      '<div class="col-span-full text-sm text-slate-500 py-8 text-center">Memuat data spot...</div>';
  }
  if (spotsCountText) {
    spotsCountText.textContent = "Memuat data spot...";
  }
}

// ---------- RENDER: FEATURED ----------

function renderFeaturedSpots(activeCategory = null) {
  if (!featuredContainer) return;

  if (!hasLoadedSpots) {
    featuredContainer.innerHTML =
      '<p class="text-xs text-slate-500">Memuat pilihan terbaik...</p>';
    return;
  }

  featuredContainer.innerHTML = "";

  let featured = SPOTS.filter((spot) => spot.isFeatured);

  if (activeCategory && activeCategory !== "All") {
    featured = featured.filter((spot) => spot.category === activeCategory);
  }

  if (featured.length === 0) {
    featuredContainer.innerHTML =
      '<p class="text-xs text-slate-500 col-span-full">Belum ada pilihan terbaik untuk kategori ini.</p>';
    return;
  }

  featured.forEach((spot) => {
    const card = document.createElement("article");
    card.className =
      "spot-card bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col";

    const imageUrl =
      spot.imageUrl ||
      "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1200";

    card.innerHTML = `
      <div class="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src="${imageUrl}"
          alt="${spot.name || ""}"
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-semibold text-white truncate">
              ${spot.name || "-"}
            </p>
            <p class="text-[10px] text-slate-100">
              ${formatDistance(spot.distance)}
            </p>
          </div>
        </div>
      </div>
      <div class="p-3.5 flex flex-col gap-2 flex-1">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] text-slate-600 border border-slate-200">
            <span aria-hidden="true">${getCategoryIcon(spot.category)}</span>
            <span>${spot.category || "-"}</span>
          </span>
          <span class="text-[10px] text-amber-500 font-medium">
            <span class="inline-flex items-center gap-1">
              <i class="ri-star-s-fill text-[11px]" aria-hidden="true"></i>
              Pilihan Terbaik
            </span>
          </span>
        </div>
        <p class="text-xs text-slate-600 line-clamp-3">
          ${spot.shortDescription || ""}
        </p>
        <button
          class="mt-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
          data-role="open-detail"
        >
          Lihat detail
          <i class="ri-arrow-up-right-line text-sm" aria-hidden="true"></i>
        </button>
      </div>
    `;

    const detailBtn = card.querySelector('[data-role="open-detail"]');
    detailBtn.addEventListener("click", () => openDetailModal(spot));

    featuredContainer.appendChild(card);
  });
}

// ---------- RENDER: LIST ALL SPOTS ----------

function renderSpots(category = "All") {
  if (!spotsListContainer) return;

  currentCategory = category;

  if (!hasLoadedSpots) {
    spotsListContainer.innerHTML =
      '<div class="col-span-full text-sm text-slate-500 py-8 text-center">Memuat data spot...</div>';
    if (spotsCountText) {
      spotsCountText.textContent = "Memuat data spot...";
    }
    if (emptyState) emptyState.classList.add("hidden");
    return;
  }

  spotsListContainer.innerHTML = "";

  let filtered =
    category === "All"
      ? [...SPOTS]
      : SPOTS.filter((spot) => spot.category === category);

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    if (spotsCountText) spotsCountText.textContent = "Menampilkan 0 spot.";
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");
  if (spotsCountText) {
    spotsCountText.textContent = `Menampilkan ${filtered.length} spot${
      category !== "All" ? ` untuk kategori ${category}.` : "."
    }`;
  }

  filtered.forEach((spot) => {
    const card = document.createElement("article");
    card.className =
      "spot-card bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col";

    const imageUrl =
      spot.imageUrl ||
      "https://images.pexels.com/photos/3808904/pexels-photo-3808904.jpeg?auto=compress&cs=tinysrgb&w=1200";

    card.innerHTML = `
      <div class="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src="${imageUrl}"
          alt="${spot.name || ""}"
          class="h-full w-full object-cover"
        />
        <div class="absolute left-2 top-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] text-slate-50">
            <span aria-hidden="true">${getCategoryIcon(spot.category)}</span>
            <span>${spot.category || "-"}</span>
          </span>
        </div>
      </div>
      <div class="p-3.5 flex flex-col gap-2 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-semibold text-slate-900 line-clamp-2">
            ${spot.name || "-"}
          </h3>
          <p class="text-[11px] text-slate-500 whitespace-nowrap">
            ${formatDistance(spot.distance)}
          </p>
        </div>
        <p class="text-xs text-slate-600 line-clamp-3">
          ${spot.shortDescription || ""}
        </p>
        <div class="mt-auto flex items-center justify-between pt-1">
          <button
            class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
            data-role="open-detail"
          >
            Lihat detail
            <i class="ri-arrow-up-right-line text-sm" aria-hidden="true"></i>
          </button>
          <a
            href="swipe.html"
            class="inline-flex items-center gap-1 text-[11px] text-kampuspot-600 hover:text-kampuspot-500"
          >
            Swipe spot ini
            <i class="ri-arrow-right-line text-sm" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    `;

    const detailBtn = card.querySelector('[data-role="open-detail"]');
    detailBtn.addEventListener("click", () => openDetailModal(spot));

    spotsListContainer.appendChild(card);
  });
}

// ---------- CATEGORY FILTER ----------

function initCategoryFilter() {
  const chips = document.querySelectorAll(".category-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const category = chip.getAttribute("data-category");

      chips.forEach((c) => c.classList.remove("category-chip--active"));
      chip.classList.add("category-chip--active");

      renderSpots(category);
      renderFeaturedSpots(category === "All" ? null : category);
    });
  });
}

// ---------- MODAL DETAIL ----------

function openDetailModal(spot) {
  currentDetailSpot = spot;
  if (!detailModal) return;

  const imageUrl =
    spot.imageUrl ||
    "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1200";

  detailImage.src = imageUrl;
  detailImage.alt = spot.name || "";
  detailName.textContent = spot.name || "-";
  detailCategory.innerHTML = `
    <span aria-hidden="true">${getCategoryIcon(spot.category)}</span>
    <span>${spot.category || "-"}</span>
  `;
  detailDistance.textContent = `${formatDistance(spot.distance)} dari kampus`;
  detailLocation.textContent = spot.locationText || "-";
  detailShortDescription.textContent = spot.shortDescription || "";
  detailFullDescription.textContent = spot.fullDescription || "";

  detailModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeDetailModal() {
  if (!detailModal) return;
  detailModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  currentDetailSpot = null;
}

function initModal() {
  if (!detailModal) return;

  detailModalClose?.addEventListener("click", closeDetailModal);
  detailModalOverlay?.addEventListener("click", closeDetailModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !detailModal.classList.contains("hidden")) {
      closeDetailModal();
    }
  });
}

// ---------- NAVBAR & SCROLL UTILS ----------

function initNavbar() {
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  const navIconOpen = document.getElementById("navIconOpen");
  const navIconClose = document.getElementById("navIconClose");

  if (!navToggle || !mobileNav) return;

  navToggle.addEventListener("click", () => {
    const isHidden = mobileNav.classList.contains("hidden");
    mobileNav.classList.toggle("hidden", !isHidden);
    navIconOpen.classList.toggle("hidden", !isHidden);
    navIconClose.classList.toggle("hidden", isHidden);
  });

  const scrollBtns = mobileNav.querySelectorAll("[data-scroll-target]");
  scrollBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-scroll-target");
      if (target) {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
      mobileNav.classList.add("hidden");
      navIconOpen.classList.remove("hidden");
      navIconClose.classList.add("hidden");
    });
  });
}

function initHeroButtons() {
  const heroExploreBtn = document.getElementById("btnHeroExplore");
  const scrollTopBtn = document.getElementById("btnScrollTop");

  if (heroExploreBtn) {
    heroExploreBtn.addEventListener("click", () => {
      const section = document.getElementById("explore-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

// ---------- FIRESTORE SUBSCRIBE ----------

function subscribeSpots() {
  const q = query(spotsColRef, orderBy("createdAt", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      SPOTS = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      hasLoadedSpots = true;

      renderFeaturedSpots(currentCategory === "All" ? null : currentCategory);
      renderSpots(currentCategory);
    },
    (error) => {
      console.error(error);
      if (spotsCountText) {
        spotsCountText.textContent = "Gagal memuat data spot.";
      }
      if (featuredContainer) {
        featuredContainer.innerHTML =
          '<p class="text-xs text-rose-500">Gagal memuat rekomendasi.</p>';
      }
    }
  );
}

// ---------- INIT ----------

document.addEventListener("DOMContentLoaded", () => {
  renderInitialLoading();
  initCategoryFilter();
  initModal();
  initNavbar();
  initHeroButtons();

  const footerYear = document.getElementById("footerYear");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  subscribeSpots();
});
