# 01 — Project Overview

## 1. Ringkasan

RuangKata adalah aplikasi web publikasi artikel. Pengguna dapat membaca artikel publik, membuat akun, dan setelah login dapat menulis serta mengelola artikel dan berinteraksi melalui komentar, like, dan bookmark.

Produk mengambil pola umum platform blogging/article publishing. Fokus MVP adalah alur publikasi artikel yang sederhana, bukan platform newsletter atau monetisasi.

## 2. Tujuan proyek

- Menyediakan tempat untuk membaca dan menerbitkan tulisan.
- Memberikan pengalaman menulis artikel dengan konten Markdown.
- Menyediakan interaksi dasar antara penulis dan pembaca.
- Menjadi proyek full-stack tim dengan pembagian kerja frontend dan backend yang jelas.

## 3. Target pengguna

- **Guest:** pengguna yang belum login; dapat melihat artikel yang dipublikasikan.
- **Registered user:** pengguna yang sudah memiliki akun; dapat mengelola artikel sendiri dan menggunakan fitur interaksi yang memerlukan login.

Pada MVP, registered user dapat berperan sebagai pembaca sekaligus penulis. Belum ada sistem role editor/admin yang kompleks.

## 4. Ruang lingkup MVP

### In scope

- Register, login, logout, dan pemulihan sesi melalui refresh token.
- Daftar artikel terpublikasi dan detail artikel.
- Pembuatan, pengeditan, penerbitan, dan penghapusan artikel milik sendiri.
- Kategori artikel.
- Komentar.
- Like dan unlike.
- Bookmark dan remove bookmark.
- Upload cover image atau gambar artikel.

### Out of scope

- Newsletter dan email campaign.
- Paid subscription, payment, dan paywall.
- Rekomendasi artikel berbasis AI.
- Aplikasi native mobile.
- Sistem moderasi dan role administrator yang kompleks.

## 5. Prinsip produk

- Sederhana untuk digunakan dan dikembangkan.
- Konten artikel disimpan sebagai Markdown.
- File gambar disimpan di object storage, bukan sebagai binary di database.
- Backend menjadi satu-satunya jalur akses aplikasi ke database.
- Keamanan dan ownership diperiksa di backend, bukan hanya melalui UI frontend.

## 6. Status implementasi

| Area                           | Status per 7 Nov 2026 |
| ------------------------------ | --------------------- |
| Setup Express dan Prisma       | Implemented           |
| PostgreSQL dan schema awal     | Implemented           |
| Register/login/logout          | Implemented dan diuji |
| Refresh token rotation         | Implemented dan diuji |
| Refresh token reuse detection  | Implemented dan diuji |
| Access-token middleware        | Next implementation   |
| Ownership/authorization        | Next implementation   |
| Article CRUD dan publish flow  | Planned               |
| Comments, likes, bookmarks API | Planned               |
| Frontend integration           | Planned               |
| Deployment end-to-end          | Planned               |

Status di atas perlu diperbarui oleh tim ketika ada perubahan implementasi.
