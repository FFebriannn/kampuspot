import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const $ = id => document.getElementById(id);

const loginSection = $("loginSection");
const adminSection = $("adminSection");
const loginForm = $("loginForm");
const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");
const loginError = $("loginError");

const adminMessage = $("adminMessage");
const adminEmail = $("adminEmail");
const spotsCount = $("spotsCountAdmin");
const btnLogout = $("btnLogout");

const spotsTableBody = $("spotsTableBody");

const spotForm = $("spotForm");
const spotId = $("spotId");
const spotName = $("spotName");
const spotCategory = $("spotCategory");
const spotDistance = $("spotDistance");
const shortDesc = $("shortDescription");
const imageUrl = $("imageUrl");
const locationText = $("locationText");
const isFeatured = $("isFeatured");

const formModeText = $("formModeText");
const btnResetForm = $("btnResetForm");
const submitBtn = $("submitSpotBtn");

const spotsRef = collection(db, "spots");

let cache = [];
let unsub = null;

const showMessage = (type, text) => {
  if (!text) return adminMessage.classList.add("hidden");
  adminMessage.textContent = text;
  adminMessage.className =
    `mb-4 rounded-2xl border px-3.5 py-2.5 text-sm ${
      type === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700"
    }`;
  setTimeout(() => adminMessage.classList.add("hidden"), 4000);
};

const resetForm = () => {
  spotForm.reset();
  spotId.value = "";
  isFeatured.checked = false;
  formModeText.textContent = "Mode: tambah spot baru";
  submitBtn.textContent = "Simpan Spot";
};

const fillForm = s => {
  spotId.value = s.id;
  spotName.value = s.name;
  spotCategory.value = s.category;
  spotDistance.value = s.distance;
  shortDesc.value = s.shortDescription;
  imageUrl.value = s.imageUrl;
  locationText.value = s.locationText || "";
  isFeatured.checked = !!s.isFeatured;
  formModeText.textContent = "Mode: edit spot";
  submitBtn.textContent = "Update Spot";
};

const formatDistance = d => d < 1000 ? `${d} m` : `${(d / 1000).toFixed(1)} km`;

const renderTable = () => {
  spotsCount.textContent = `${cache.length} spot terdaftar.`;
  spotsTableBody.innerHTML = cache.length
    ? cache.map(s => `
      <tr class="border-t hover:bg-slate-50/60">
        <td class="px-3 py-2">${s.name}</td>
        <td class="px-3 py-2">${s.category}</td>
        <td class="px-3 py-2">${formatDistance(s.distance)}</td>
        <td class="px-3 py-2">${s.isFeatured ? "Ya" : "Tidak"}</td>
        <td class="px-3 py-2 text-right">
          <button data-action="edit" data-id="${s.id}" class="text-xs px-2 border rounded">Edit</button>
          <button data-action="delete" data-id="${s.id}" class="text-xs px-2 border rounded text-rose-600">Hapus</button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="5" class="px-3 py-3 text-center text-xs text-slate-500">Belum ada data spot.</td></tr>`;
};

const subscribeSpots = () => {
  unsub?.();
  unsub = onSnapshot(
    query(spotsRef, orderBy("createdAt", "desc")),
    snap => {
      cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderTable();
    }
  );
};

onAuthStateChanged(auth, user => {
  loginSection.classList.toggle("hidden", !!user);
  adminSection.classList.toggle("hidden", !user);
  if (user) {
    adminEmail.textContent = user.email;
    subscribeSpots();
    showMessage("success", "Login admin berhasil.");
  } else {
    cache = [];
    renderTable();
    unsub?.();
  }
});

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value.trim()
    );
    loginPassword.value = "";
  } catch (e) {
    loginError.textContent = e.code;
    loginError.classList.remove("hidden");
  }
});

btnLogout.addEventListener("click", () => signOut(auth));
btnResetForm.addEventListener("click", resetForm);

spotForm.addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    name: spotName.value.trim(),
    category: spotCategory.value,
    distance: Number(spotDistance.value),
    shortDescription: shortDesc.value.trim(),
    imageUrl: imageUrl.value.trim(),
    locationText: locationText.value.trim(),
    isFeatured: isFeatured.checked,
    updatedAt: serverTimestamp()
  };

  try {
    if (spotId.value) {
      await updateDoc(doc(spotsRef, spotId.value), payload);
      showMessage("success", "Spot diperbarui.");
    } else {
      await addDoc(spotsRef, { ...payload, createdAt: serverTimestamp() });
      showMessage("success", "Spot ditambahkan.");
    }
    resetForm();
  } catch (e) {
    showMessage("error", e.message);
  }
});

spotsTableBody.addEventListener("click", async e => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const spot = cache.find(s => s.id === btn.dataset.id);
  if (!spot) return;

  if (btn.dataset.action === "edit") fillForm(spot);
  if (btn.dataset.action === "delete" && confirm("Hapus spot ini?")) {
    await deleteDoc(doc(spotsRef, spot.id));
    showMessage("success", "Spot dihapus.");
  }
});