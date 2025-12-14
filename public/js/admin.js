import { db, auth } from "./firebase-config.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// ---------- DOM ELEMENTS ----------
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");

const loginForm = document.getElementById("loginForm");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const loginErrorEl = document.getElementById("loginError");

const adminMessageEl = document.getElementById("adminMessage");
const adminEmailEl = document.getElementById("adminEmail");
const spotsCountAdminEl = document.getElementById("spotsCountAdmin");
const btnLogout = document.getElementById("btnLogout");

const spotsTableBody = document.getElementById("spotsTableBody");

const spotForm = document.getElementById("spotForm");
const spotIdInput = document.getElementById("spotId");
const spotNameInput = document.getElementById("spotName");
const spotCategorySelect = document.getElementById("spotCategory");
const spotDistanceInput = document.getElementById("spotDistance");
const shortDescriptionInput = document.getElementById("shortDescription");
const fullDescriptionInput = document.getElementById("fullDescription");
const imageUrlInput = document.getElementById("imageUrl");
const locationTextInput = document.getElementById("locationText");
const isFeaturedInput = document.getElementById("isFeatured");

const formModeText = document.getElementById("formModeText");
const btnResetForm = document.getElementById("btnResetForm");
const submitSpotBtn = document.getElementById("submitSpotBtn");

const spotsColRef = collection(db, "spots");

// ---------- STATE ----------
let cachedSpots = [];
let unsubscribeSpots = null;

// ---------- UTILS ----------
function showMessage(type, text) {
  if (!adminMessageEl) return;
  if (!text) {
    adminMessageEl.classList.add("hidden");
    adminMessageEl.textContent = "";
    adminMessageEl.className =
      "hidden mb-4 rounded-2xl border px-3.5 py-2.5 text-xs sm:text-sm";
    return;
  }

  adminMessageEl.textContent = text;
  adminMessageEl.classList.remove("hidden");

  // reset base class
  adminMessageEl.className =
    "mb-4 rounded-2xl border px-3.5 py-2.5 text-xs sm:text-sm";

  if (type === "error") {
    adminMessageEl.classList.add(
      "border-rose-200",
      "bg-rose-50",
      "text-rose-700"
    );
  } else {
    adminMessageEl.classList.add(
      "border-emerald-200",
      "bg-emerald-50",
      "text-emerald-700"
    );
  }

  // auto hide after a while
  setTimeout(() => {
    showMessage(null, "");
  }, 4000);
}

function resetForm() {
  spotIdInput.value = "";
  spotNameInput.value = "";
  spotCategorySelect.value = "";
  spotDistanceInput.value = "";
  shortDescriptionInput.value = "";
  fullDescriptionInput.value = "";
  imageUrlInput.value = "";
  locationTextInput.value = "";
  isFeaturedInput.checked = false;

  formModeText.textContent = "Mode: tambah spot baru";
  submitSpotBtn.textContent = "Simpan Spot";
}

function fillFormWithSpot(spot) {
  spotIdInput.value = spot.id || "";
  spotNameInput.value = spot.name || "";
  spotCategorySelect.value = spot.category || "";
  spotDistanceInput.value = spot.distance ?? "";
  shortDescriptionInput.value = spot.shortDescription || "";
  fullDescriptionInput.value = spot.fullDescription || "";
  imageUrlInput.value = spot.imageUrl || "";
  locationTextInput.value = spot.locationText || "";
  isFeaturedInput.checked = Boolean(spot.isFeatured);

  formModeText.textContent = "Mode: edit spot";
  submitSpotBtn.textContent = "Update Spot";
}

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

// ---------- RENDER TABLE ----------
function renderSpotsTable() {
  if (!spotsTableBody) return;

  spotsCountAdminEl.textContent = `${cachedSpots.length} spot terdaftar.`;

  if (cachedSpots.length === 0) {
    spotsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-3 py-3 text-[11px] text-slate-500 text-center">
          Belum ada data spot. Tambahkan spot baru melalui form di sebelah kanan.
        </td>
      </tr>
    `;
    return;
  }

  spotsTableBody.innerHTML = "";

  cachedSpots.forEach((spot) => {
    const tr = document.createElement("tr");
    tr.className = "border-t border-slate-100 hover:bg-slate-50/60";

    tr.innerHTML = `
      <td class="px-3 py-2 align-top">
        <div class="flex flex-col">
          <span class="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2">
            ${spot.name || "-"}
          </span>
          <span class="text-[11px] text-slate-400">
            ${spot.locationText || ""}
          </span>
        </div>
      </td>
      <td class="px-3 py-2 align-top">
        <span class="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[11px] text-slate-600 border border-slate-200">
          <span aria-hidden="true">${getCategoryIcon(spot.category)}</span>
          <span>${spot.category || "-"}</span>
        </span>
      </td>
      <td class="px-3 py-2 align-top text-xs text-slate-600 whitespace-nowrap">
        ${formatDistance(spot.distance)}
      </td>
      <td class="px-3 py-2 align-top text-xs text-slate-600">
        ${
          spot.isFeatured
            ? '<span class="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5"><i class="ri-star-s-fill text-[11px]" aria-hidden="true"></i> Ya</span>'
            : '<span class="text-[11px] text-slate-400">Tidak</span>'
        }
      </td>
      <td class="px-3 py-2 align-top text-right">
        <div class="inline-flex items-center gap-1.5">
          <button
            class="text-[11px] px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            data-action="edit"
            data-id="${spot.id}"
          >
            Edit
          </button>
          <button
            class="text-[11px] px-2 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            data-action="delete"
            data-id="${spot.id}"
          >
            Hapus
          </button>
        </div>
      </td>
    `;

    spotsTableBody.appendChild(tr);
  });
}

// ---------- FIRESTORE SUBSCRIPTION ----------
function subscribeSpots() {
  if (unsubscribeSpots) {
    unsubscribeSpots();
    unsubscribeSpots = null;
  }

  const q = query(spotsColRef, orderBy("createdAt", "desc"));

  unsubscribeSpots = onSnapshot(
    q,
    (snapshot) => {
      cachedSpots = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      renderSpotsTable();
    },
    (error) => {
      console.error(error);
      showMessage("error", "Gagal memuat data spot: " + error.message);
    }
  );
}

// ---------- AUTH HANDLERS ----------
function setAuthUI(user) {
  if (user) {
    // logged in
    loginSection.classList.add("hidden");
    adminSection.classList.remove("hidden");
    adminEmailEl.textContent = user.email || "(tanpa email)";
    showMessage("success", "Berhasil login sebagai admin.");
    subscribeSpots();
  } else {
    // logged out
    loginSection.classList.remove("hidden");
    adminSection.classList.add("hidden");
    adminEmailEl.textContent = "";
    cachedSpots = [];
    renderSpotsTable();
    if (unsubscribeSpots) {
      unsubscribeSpots();
      unsubscribeSpots = null;
    }
  }
}

function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    setAuthUI(user);
  });
}

// ---------- EVENT: LOGIN ----------
function initLoginForm() {
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErrorEl.classList.add("hidden");
    loginErrorEl.textContent = "";

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();

    if (!email || !password) return;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginPasswordInput.value = "";
    } catch (error) {
      console.error(error);
      loginErrorEl.textContent =
        "Gagal login: " + (error.code || error.message);
      loginErrorEl.classList.remove("hidden");
    }
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await signOut(auth);
        showMessage("success", "Berhasil logout.");
      } catch (error) {
        console.error(error);
        showMessage("error", "Gagal logout: " + error.message);
      }
    });
  }
}

// ---------- EVENT: TABLE ACTIONS ----------
function initTableActions() {
  if (!spotsTableBody) return;

  spotsTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id) return;

    const spot = cachedSpots.find((s) => s.id === id);

    if (action === "edit") {
      if (!spot) return;
      fillFormWithSpot(spot);
      // scroll ke form
      document
        .getElementById("spotForm")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "delete") {
      const ok = confirm(`Yakin ingin menghapus spot "${spot?.name || ""}"?`);
      if (!ok) return;

      try {
        await deleteDoc(doc(spotsColRef, id));
        showMessage("success", "Spot berhasil dihapus.");
      } catch (error) {
        console.error(error);
        showMessage("error", "Gagal menghapus spot: " + error.message);
      }
    }
  });
}

// ---------- EVENT: FORM SUBMIT ----------
function initSpotForm() {
  if (!spotForm) return;

  btnResetForm?.addEventListener("click", () => {
    resetForm();
  });

  spotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = spotIdInput.value || null;
    const name = spotNameInput.value.trim();
    const category = spotCategorySelect.value;
    const distance = Number(spotDistanceInput.value);
    const shortDescription = shortDescriptionInput.value.trim();
    const fullDescription = fullDescriptionInput.value.trim();
    const imageUrl = imageUrlInput.value.trim();
    const locationText = locationTextInput.value.trim();
    const isFeatured = isFeaturedInput.checked;

    if (!name || !category || Number.isNaN(distance) || !imageUrl) {
      showMessage(
        "error",
        "Nama, kategori, jarak, dan URL gambar wajib diisi."
      );
      return;
    }

    const payload = {
      name,
      category,
      distance,
      shortDescription,
      fullDescription: fullDescription || null,
      imageUrl,
      locationText,
      isFeatured,
      updatedAt: serverTimestamp(),
    };

    submitSpotBtn.disabled = true;
    submitSpotBtn.classList.add("opacity-70", "cursor-wait");

    try {
      if (id) {
        // update
        const ref = doc(spotsColRef, id);
        await updateDoc(ref, payload);
        showMessage("success", "Spot berhasil di-update.");
      } else {
        // create
        await addDoc(spotsColRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showMessage("success", "Spot baru berhasil ditambahkan.");
      }

      resetForm();
    } catch (error) {
      console.error(error);
      showMessage("error", "Gagal menyimpan spot: " + error.message);
    } finally {
      submitSpotBtn.disabled = false;
      submitSpotBtn.classList.remove("opacity-70", "cursor-wait");
    }
  });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  resetForm();
  renderSpotsTable(); // kosong dulu
  initAuthListener();
  initLoginForm();
  initSpotForm();
  initTableActions();
});
