// Halaman swipe terhubung ke Firestore

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ---------- FIRESTORE & STATE ----------

const spotsColRef = collection(db, "spots");

let SPOTS = [];
let currentCategory = "All";
let filteredSpots = [];
let currentIndex = 0;
let hasLoadedSpots = false;
let unsubscribeSpots = null;

// ---------- DOM ELEMENTS ----------

const swipeCardContainer = document.getElementById("swipeCardContainer");
const indicatorText = document.getElementById("indicatorText");
const statsText = document.getElementById("statsText");

const btnSkip = document.getElementById("btnSkip");
const btnLike = document.getElementById("btnLike");
const btnBookmark = document.getElementById("btnBookmark");

const categoryChips = document.querySelectorAll(".category-chip");
const resetCategoryBtn = document.getElementById("resetCategory");

const toastEl = document.getElementById("toast");
const toastEmojiEl = document.getElementById("toastEmoji");
const toastMessageEl = document.getElementById("toastMessage");

const STORAGE_KEY = "kampuspot_swipes_v1";

// ---------- UTILS ----------

function formatDistance(meter) {
  if (meter == null || Number.isNaN(meter)) return "-";
  if (meter < 1000) return `${meter} m`;
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

function loadSwipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn("Gagal parse swipes dari localStorage", e);
    return [];
  }
}

function saveSwipe(spotId, action) {
  const swipes = loadSwipes();
  swipes.push({
    spotId,
    action,
    timestamp: Date.now(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(swipes));
}

function calculateStats() {
  const swipes = loadSwipes();
  let likeCount = 0;
  let bookmarkCount = 0;

  swipes.forEach((s) => {
    if (s.action === "like") likeCount += 1;
    if (s.action === "bookmark") bookmarkCount += 1;
  });

  if (statsText) {
    statsText.innerHTML = `
      <i class="ri-heart-3-fill text-rose-500" aria-hidden="true"></i>
      ${likeCount} suka •
      <i class="ri-bookmark-line text-amber-500" aria-hidden="true"></i>
      ${bookmarkCount} disimpan
    `;
  }
}

function showToast(iconHtml, message) {
  if (!toastEl) return;
  toastEmojiEl.innerHTML = iconHtml;
  toastMessageEl.textContent = message;

  toastEl.classList.remove("opacity-0", "translate-y-6");
  toastEl.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toastEl.classList.add("opacity-0", "translate-y-6");
    toastEl.classList.remove("opacity-100", "translate-y-0");
  }, 1300);
}

// ---------- RENDER ----------

function renderInitialLoading() {
  if (!swipeCardContainer) return;

  swipeCardContainer.innerHTML = `
    <div class="text-center text-sm text-slate-500 bg-white/80 border border-slate-100 rounded-3xl px-4 py-8">
      Memuat spot dari server...
    </div>
  `;
  if (indicatorText) {
    indicatorText.textContent = "Spot 0 dari 0";
  }
}

function getCurrentSpot() {
  if (currentIndex < 0 || currentIndex >= filteredSpots.length) return null;
  return filteredSpots[currentIndex];
}

function renderIndicator() {
  const total = filteredSpots.length;
  const current = total === 0 ? 0 : currentIndex + 1;
  if (indicatorText) {
    indicatorText.textContent = `Spot ${current} dari ${total}`;
  }
}

function renderEmptyState(message) {
  if (!swipeCardContainer) return;
  swipeCardContainer.innerHTML = `
    <div class="text-center text-sm text-slate-500 bg-white/80 border border-slate-100 rounded-3xl px-4 py-8">
      <p class="mb-2">${message}</p>
      <p class="text-[11px] text-slate-400">
        Silakan pilih kategori lain atau periksa panel admin untuk menambah spot baru.
      </p>
    </div>
  `;
}

function renderFinishedState() {
  if (!swipeCardContainer) return;

  swipeCardContainer.innerHTML = `
    <div class="text-center text-sm text-slate-600 bg-white/90 border border-slate-100 rounded-3xl px-4 py-8 space-y-3">
      <p class="font-semibold text-slate-800">
        Kamu sudah melihat semua spot untuk kategori ini
      </p>
      <p class="text-xs text-slate-500">
        Ganti kategori lain atau kembali ke halaman <span class="font-medium">Explore</span> untuk melihat daftar lengkap semua spot.
      </p>
      <div class="flex items-center justify-center gap-2 pt-2">
        <a
          href="index.html"
          class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-slate-300"
        >
          Buka Explore
          <i class="ri-arrow-up-right-line text-sm" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  `;
}

function renderCard() {
  const spot = getCurrentSpot();

  if (filteredSpots.length === 0) {
    if (!hasLoadedSpots) {
      renderEmptyState("Memuat data spot...");
    } else if (SPOTS.length === 0) {
      renderEmptyState("Belum ada data spot. Tambahkan dari panel admin.");
    } else {
      renderEmptyState("Belum ada spot untuk kategori ini.");
    }

    [btnSkip, btnLike, btnBookmark].forEach((btn) => {
      if (!btn) return;
      btn.disabled = true;
      btn.classList.add("opacity-40", "cursor-not-allowed");
    });

    renderIndicator();
    calculateStats();
    return;
  }

  if (!spot) {
    renderFinishedState();
    [btnSkip, btnLike, btnBookmark].forEach((btn) => {
      if (!btn) return;
      btn.disabled = true;
      btn.classList.add("opacity-40", "cursor-not-allowed");
    });
    renderIndicator();
    calculateStats();
    return;
  }

  [btnSkip, btnLike, btnBookmark].forEach((btn) => {
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove("opacity-40", "cursor-not-allowed");
  });

  const imageUrl =
    spot.imageUrl ||
    "https://images.pexels.com/photos/3808904/pexels-photo-3808904.jpeg?auto=compress&cs=tinysrgb&w=1200";

  swipeCardContainer.innerHTML = `
    <article
      class="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col"
    >
      <div class="relative aspect-[4/5] bg-slate-100 overflow-hidden">
        <img
          src="${imageUrl}"
          alt="${spot.name || ""}"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-sm font-semibold text-white line-clamp-1">
                ${spot.name || "-"}
              </p>
              <p class="text-[11px] text-slate-100">
                <span class="inline-flex items-center gap-1">
                  <span aria-hidden="true">${getCategoryIcon(spot.category)}</span>
                  <span>${spot.category || "-"}</span>
                </span>
                • ${formatDistance(spot.distance)}
              </p>
            </div>
            ${
              spot.isFeatured
                ? `<span class="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-1 text-[10px] text-slate-900 font-medium">
                    <i class="ri-star-s-fill text-[11px]" aria-hidden="true"></i>
                    Pilihan Terbaik
                  </span>`
                : ""
            }
          </div>
        </div>
      </div>

      <div class="p-3.5 flex flex-col gap-2">
        <p class="text-xs text-slate-600 line-clamp-4">
          ${spot.shortDescription || ""}
        </p>
        <p class="text-[11px] text-slate-500">
          ${spot.locationText || ""}
        </p>
      </div>
    </article>
  `;

  renderIndicator();
  calculateStats();
}

// ---------- CATEGORY FILTER ----------

function applyCategory(category) {
  currentCategory = category;

  if (category === "All") {
    filteredSpots = [...SPOTS];
  } else {
    filteredSpots = SPOTS.filter((spot) => spot.category === category);
  }

  currentIndex = 0;
  renderCard();
}

function initCategoryFilter() {
  categoryChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const cat = chip.getAttribute("data-category");
      categoryChips.forEach((c) => c.classList.remove("category-chip--active"));
      chip.classList.add("category-chip--active");
      applyCategory(cat);
    });
  });

  if (resetCategoryBtn) {
    resetCategoryBtn.addEventListener("click", () => {
      currentCategory = "All";
      filteredSpots = [...SPOTS];
      currentIndex = 0;

      categoryChips.forEach((c) => {
        const cat = c.getAttribute("data-category");
        if (cat === "All") {
          c.classList.add("category-chip--active");
        } else {
          c.classList.remove("category-chip--active");
        }
      });

      renderCard();
    });
  }
}

// ---------- SWIPE ACTIONS ----------

function goNextSpot() {
  currentIndex += 1;
  renderCard();
}

function handleAction(action) {
  const spot = getCurrentSpot();
  if (!spot) return;

  saveSwipe(spot.id, action);

  if (action === "like") {
    showToast(
      '<i class="ri-heart-3-fill text-rose-400" aria-hidden="true"></i>',
      "Ditandai suka"
    );
  } else if (action === "bookmark") {
    showToast(
      '<i class="ri-bookmark-line text-amber-400" aria-hidden="true"></i>',
      "Disimpan ke bookmark"
    );
  } else {
    showToast(
      '<i class="ri-close-line text-slate-100" aria-hidden="true"></i>',
      "Spot dilewati"
    );
  }

  goNextSpot();
}

function initControls() {
  if (btnSkip) {
    btnSkip.addEventListener("click", () => handleAction("skip"));
  }
  if (btnLike) {
    btnLike.addEventListener("click", () => handleAction("like"));
  }
  if (btnBookmark) {
    btnBookmark.addEventListener("click", () => handleAction("bookmark"));
  }

  window.addEventListener("keydown", (e) => {
    if (!getCurrentSpot()) return;

    if (e.key === "ArrowLeft") {
      handleAction("skip");
    } else if (e.key === "ArrowRight") {
      handleAction("like");
    } else if (e.key === "ArrowUp") {
      handleAction("bookmark");
    }
  });
}

// ---------- FIRESTORE SUBSCRIBE ----------

function subscribeSpots() {
  const q = query(spotsColRef, orderBy("createdAt", "desc"));

  unsubscribeSpots = onSnapshot(
    q,
    (snapshot) => {
      SPOTS = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      hasLoadedSpots = true;

      applyCategory(currentCategory);
    },
    (error) => {
      console.error(error);
      renderEmptyState("Gagal memuat data spot dari server.");
      [btnSkip, btnLike, btnBookmark].forEach((btn) => {
        if (!btn) return;
        btn.disabled = true;
        btn.classList.add("opacity-40", "cursor-not-allowed");
      });
    }
  );
}

// ---------- INIT ----------

document.addEventListener("DOMContentLoaded", () => {
  renderInitialLoading();
  initCategoryFilter();
  initControls();
  subscribeSpots();
  calculateStats();
});
