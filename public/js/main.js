import { db } from "./firebase-config.js";
import { collection, query, orderBy, onSnapshot } 
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const spotsRef = collection(db, "spots");

let SPOTS = [], current = "All";

const icon = c => ({
  Makanan:"ri-restaurant-2-line",
  Kafe:"ri-cup-line",
  Belajar:"ri-book-open-line",
  Hiburan:"ri-gamepad-line"
}[c] || "ri-map-pin-line");

const dist = m =>
  m == null || isNaN(m) ? "-" : m < 1000 ? `${m} m` : `${(m/1000).toFixed(1)} km`;

/* ================= MODAL ================= */
const openModal = s => {
  $("detailImage").src = s.imageUrl || "";
  $("detailName").textContent = s.name || "-";
  $("detailCategory").innerHTML = `<i class="${icon(s.category)}"></i> ${s.category||"-"}`;
  $("detailDistance").textContent = `${dist(s.distance)} dari kampus`;
  $("detailLocation").textContent = s.locationText || "-";
  $("detailShortDescription").textContent = s.shortDescription || "";
  $("detailModal").classList.remove("hidden");
  document.body.classList.add("modal-open");
};
const closeModal = () => {
  $("detailModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
};

/* ================= CARD ================= */
const card = (s, featured=false) => {
  const el = document.createElement("article");
  el.className =
    "spot-card cursor-pointer bg-white rounded-2xl border shadow-md overflow-hidden flex flex-col";
  el.innerHTML = `
    <div class="relative aspect-[4/3] overflow-hidden">
      <img src="${s.imageUrl||""}" class="h-full w-full object-cover"/>
      ${featured
        ? `<div class="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/60">
            <div class="flex justify-between text-white text-xs font-semibold">
              <span class="truncate">${s.name||"-"}</span><span>${dist(s.distance)}</span>
            </div>
           </div>`
        : `<span class="absolute left-2 top-2 text-[10px] bg-slate-900/80 text-white px-2 py-1 rounded-full">
            <i class="${icon(s.category)}"></i> ${s.category||"-"}
           </span>`}
    </div>
    <div class="p-3.5 flex flex-col gap-2 flex-1">
      ${!featured
        ? `<div class="flex justify-between">
             <h3 class="text-sm font-semibold line-clamp-2">${s.name||"-"}</h3>
             <span class="text-[11px] text-slate-500">${dist(s.distance)}</span>
           </div>`
        : `<div class="flex justify-between text-[10px]">
             <span class="px-2 py-1 border rounded-full">${s.category||"-"}</span>
             <span class="text-amber-500"><i class="ri-star-s-fill"></i> Pilihan</span>
           </div>`}
      <p class="text-xs text-slate-600 line-clamp-3">${s.shortDescription||""}</p>
    </div>`;
  el.onclick = () => openModal(s);
  return el;
};

/* ================= RENDER ================= */
const render = () => {
  const list = current==="All"?SPOTS:SPOTS.filter(s=>s.category===current);
  $("spotsList").innerHTML="";
  $("featuredSpots").innerHTML="";

  $("spotsCountText").textContent = `Menampilkan ${list.length} spot.`;
  $("emptyState").classList.toggle("hidden", list.length>0);

  SPOTS.filter(s=>s.isFeatured)
    .filter(s=>current==="All"||s.category===current)
    .forEach(s=>$("featuredSpots").appendChild(card(s,true)));

  list.forEach(s=>$("spotsList").appendChild(card(s)));
};

/* ================= FILTER ================= */
document.querySelectorAll(".category-chip").forEach(c=>{
  c.onclick=()=>{
    document.querySelectorAll(".category-chip").forEach(x=>x.classList.remove("category-chip--active"));
    c.classList.add("category-chip--active");
    current=c.dataset.category;
    render();
  };
});

/* ================= NAV & MODAL ================= */
$("navToggle")?.addEventListener("click",()=>$("mobileNav")?.classList.toggle("hidden"));
$("btnHeroExplore")?.addEventListener("click",()=>$("explore-section")?.scrollIntoView({behavior:"smooth"}));
$("btnScrollTop")?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
$("detailModalClose")?.addEventListener("click",closeModal);
$("detailModalOverlay")?.addEventListener("click",closeModal);
window.addEventListener("keydown",e=>e.key==="Escape"&&closeModal());

/* ================= FIRESTORE ================= */
onSnapshot(query(spotsRef, orderBy("createdAt","desc")), snap=>{
  SPOTS = snap.docs.map(d=>({id:d.id,...d.data()}));
  render();
});

/* ================= INIT ================= */
$("footerYear").textContent = new Date().getFullYear();