# 📍 KAMPUSPOT  
**Temukan Spot Terbaik di Sekitar Kampus**

Aplikasi web berbasis Firebase untuk membantu mahasiswa menemukan tempat makan, nongkrong, belajar, dan hiburan di sekitar kampus secara cepat dan interaktif.

---

## ✨ Fitur Utama

### 🗺️ Explore Spot
- Menampilkan daftar spot di sekitar kampus
- Filter kategori (Makanan, Kafe, Belajar, Hiburan)
- Spot unggulan (featured)
- Detail spot menggunakan modal tanpa reload halaman

### ❤️ Swipe Mode
- Interaksi cepat dengan sistem swipe
- Aksi Skip, Like, dan Bookmark
- Statistik interaksi pengguna
- Navigasi menggunakan tombol dan keyboard
- Penyimpanan interaksi menggunakan Local Storage

### 🔐 Admin Panel
- Login admin menggunakan Firebase Authentication
- CRUD data spot (Tambah, Edit, Hapus)
- Update data real-time ke halaman Explore dan Swipe
- Penandaan spot unggulan (featured)

### ⚡ Real-time Database
- Menggunakan Cloud Firestore
- Sinkronisasi data secara real time
- Timestamp otomatis (createdAt & updatedAt)

---

## 🚀 Tech Stack

- **HTML5**
- **Tailwind CSS (CDN)**
- **JavaScript (ES Module)**
- **Firebase Firestore**
- **Firebase Authentication**
- **Firebase Hosting**
- **Local Storage**

---

## 📁 Struktur Proyek

KAMPUSPOT/
│
├── public/
│ ├── assets/
│ │ └── css/
│ │ └── styles.css
│ │
│ ├── js/
│ │ ├── firebase-config.js
│ │ ├── main.js
│ │ ├── swipe.js
│ │ └── admin.js
│ │
│ ├── index.html
│ ├── swipe.html
│ ├── admin.html
│ ├── logo.png
│ └── firebase.json
│
└── README.md

---

## 🔥 Struktur Database Firestore

### Collection: `spots`

Setiap dokumen merepresentasikan satu spot.

| Field | Tipe | Deskripsi |
|------|------|----------|
| name | string | Nama spot |
| category | string | Kategori spot |
| distance | number | Jarak dari kampus (meter) |
| shortDescription | string | Deskripsi singkat |
| fullDescription | string | Deskripsi lengkap |
| imageUrl | string | URL gambar |
| locationText | string | Lokasi dalam bentuk teks |
| isFeatured | boolean | Penanda spot unggulan |
| createdAt | timestamp | Waktu pembuatan |
| updatedAt | timestamp | Waktu terakhir diperbarui |

---

## 🔐 Autentikasi

- Menggunakan **Firebase Authentication (Email & Password)**
- Halaman admin hanya dapat diakses oleh akun admin
- Pengguna umum hanya dapat mengakses Explore dan Swipe

---

## ⚙️ Cara Menjalankan Proyek

### 1️⃣ Clone Repository
```bash
git clone https://github.com/username/kampuspot.git
cd kampuspot
2️⃣ Konfigurasi Firebase
Buat project di Firebase Console

Aktifkan:

Firestore Database

Authentication (Email/Password)

Salin konfigurasi Firebase ke file firebase-config.js

3️⃣ Jalankan Aplikasi
Karena aplikasi ini bersifat statis:

Gunakan Live Server

Atau buka langsung index.html melalui browser

🌍 Deployment ke Firebase Hosting
bash
Copy code
firebase login
firebase init hosting
firebase deploy
Pastikan folder publik diarahkan ke folder public/.

🧠 Alur Kerja Aplikasi
Admin login melalui halaman Admin Panel

Admin mengelola data spot

Data disimpan di Firestore

Halaman Explore dan Swipe ter-update secara real time

User menjelajahi spot melalui Explore atau Swipe

Interaksi swipe disimpan di Local Storage

📌 Use Case
Mahasiswa mencari tempat makan, nongkrong, dan belajar

Admin mengelola rekomendasi spot sekitar kampus

Eksplorasi cepat menggunakan sistem swipe

📄 Lisensi
Proyek ini menggunakan MIT License dan bebas digunakan untuk pembelajaran.

👨‍💻 Author
KAMPUSPOT
Dibuat sebagai proyek pembelajaran pengembangan web berbasis Firebase.
