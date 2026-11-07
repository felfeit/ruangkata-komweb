# RuangKata

RuangKata adalah platform publikasi artikel berbasis web yang memungkinkan pengguna membaca, menulis, dan berinteraksi dengan artikel. Proyek ini dikembangkan sebagai proyek tim dengan pendekatan full-stack sederhana.

## Project status

Dokumentasi ini menjadi acuan awal bersama untuk frontend dan backend. Status implementasi yang dicatat di dalamnya mengikuti kondisi proyek per 7 November 2026.

- Sudah diimplementasikan dan diuji: setup backend dasar, koneksi Prisma ke PostgreSQL, register, login, logout, refresh token rotation, dan reuse detection.
- Sudah disepakati, perlu dilanjutkan: middleware autentikasi, authorization/ownership check, endpoint artikel, komentar, like, bookmark, serta integrasi frontend.
- Rencana arsitektur: satu layanan Render untuk menyajikan frontend build dan Express API; Supabase untuk PostgreSQL dan penyimpanan gambar.

Dokumentasi ini tidak berarti semua endpoint atau fitur sudah tersedia. Lihat status masing-masing bagian sebelum mengintegrasikan fitur.

## Tech stack

| Layer             | Teknologi                               |
| ----------------- | --------------------------------------- |
| Frontend          | React, Vite, JavaScript                 |
| Backend           | Node.js, Express.js                     |
| ORM               | Prisma 6.19.3                           |
| Database          | PostgreSQL (Supabase)                   |
| Image storage     | Supabase Storage                        |
| Authentication    | JWT access token + refresh token cookie |
| Deployment target | Render                                  |

## Repository structure

```text
ruangkata/
├── frontend/    # React + Vite + JavaScript
├── backend/     # Express API + Prisma
├── docs/        # Project documentation
├── README.md
└── .gitignore
```

## Core features

- Membaca artikel yang sudah dipublikasikan.
- Registrasi, login, dan logout.
- Menulis, mengedit, menerbitkan, dan menghapus artikel.
- Kategori artikel.
- Komentar pada artikel.
- Like dan bookmark.
- Upload gambar cover/artikel.

## Authentication overview

- Access token berlaku 15 menit dan dikirim frontend melalui `Authorization: Bearer <token>`.
- Refresh token berlaku 14 hari dan disimpan sebagai cookie `HttpOnly`.
- Refresh token dirotasi setiap kali endpoint refresh berhasil digunakan.
- Hash refresh token disimpan di tabel `refresh_tokens`; token mentah tidak disimpan di database.
- Frontend tidak membaca atau menyimpan refresh token. Browser mengelola cookie.
- Access token disimpan di memory aplikasi frontend dan diperbarui melalui endpoint refresh saat diperlukan.

## Local development

### Backend

1. Masuk ke folder backend.
2. Install dependency dengan `npm install`.
3. Salin `.env.example` menjadi `.env`, lalu isi kredensial lokal.
4. Jalankan `npx prisma generate`.
5. Jalankan migrasi sesuai instruksi pada `docs/06-database/`.
6. Jalankan server menggunakan script yang tersedia di `package.json` atau `node src/server.js`.

### Frontend

1. Masuk ke folder frontend.
2. Jalankan `npm install`.
3. Atur base URL API sesuai environment.
4. Jalankan development server menggunakan `npm run dev`.

Detail lebih lanjut ada di `docs/08-development/`.

## Documentation index

| Folder                | Isi                                       |
| --------------------- | ----------------------------------------- |
| `01-project-overview` | Ringkasan produk, tujuan, ruang lingkup   |
| `02-requirements`     | Kebutuhan fungsional dan nonfungsional    |
| `03-architecture`     | Arsitektur sistem dan keputusan teknologi |
| `04-frontend`         | Panduan frontend dan integrasi API        |
| `05-backend`          | Struktur backend, autentikasi, aturan API |
| `06-database`         | Model data dan migrasi                    |
| `07-api-reference`    | Kontrak endpoint                          |
| `08-development`      | Setup lokal, Git workflow, checklist      |

## Team conventions

- Jangan commit file `.env`, secret, access token, refresh token, atau service-role key.
- Perubahan kontrak API harus diperbarui di `docs/07-api-reference/`.
- Perubahan schema harus disertai Prisma migration dan pembaruan `docs/06-database/`.
- Frontend hanya berkomunikasi dengan backend API; jangan mengakses tabel Supabase secara langsung.
- Jangan menganggap endpoint berstatus planned sudah tersedia.
- Gunakan branch dan pull request sesuai kesepakatan tim.

## Security notes

- Jangan pernah mengekspos `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL` privileged, `DIRECT_URL`, atau Supabase service-role key ke frontend.
- `HttpOnly` mencegah JavaScript membaca cookie refresh token, tetapi bukan pengganti sanitasi input, proteksi XSS, atau pertimbangan CSRF.
- Endpoint privat wajib memverifikasi access token dan memeriksa ownership/authorization di backend.
- Artikel Markdown harus dirender dengan sanitasi HTML yang aman.
- Public Storage bucket berarti siapa pun yang memiliki URL gambar dapat melihat file tersebut. Jangan mengunggah konten privat/draft yang seharusnya rahasia ke bucket publik.

## Current limitations

Dokumentasi ini merupakan baseline awal. Detail yang belum dikonfirmasi dari implementasi aktual ditandai sebagai planned atau perlu diselaraskan. Sebelum rilis, tim perlu melengkapi validasi input, rate limiting, penanganan error konsisten, pengujian otomatis, logging, dan konfigurasi deployment.
