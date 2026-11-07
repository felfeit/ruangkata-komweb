# 01: Project Overview

## 1. Overview

RuangKata adalah aplikasi web untuk mempublikasikan artikel digital. User dapat membaca artikel publik, membuat akun, dan setelah login dapat menulis artikel, mengelola artikel, dan berinteraksi dengan memberikan komentar, like, dan bookmark pada artikel.

## 2. Project Purpose

- Menyediakan tempat untuk membaca dan menerbitkan tulisan.
- Memberikan pengalaman menulis artikel dengan konten Markdown.
- Menyediakan interaksi dasar antara penulis dan pembaca.
- Menjadi proyek full-stack tim dengan pembagian kerja frontend dan backend yang jelas.

## 3. User Target

- Guest: Pengguna yang belum login. Dapat melihat dan membaca artikel yang dipublikasikan.
- Registered user: Pengguna yang sudah memiliki akun. Dapat membaca, menulis, dan mengelola artikel sendiri dan menggunakan fitur interaksi yang membutuhkan login.

## 4. Minimum Viable Product (MVP) Scope

### In scope

- Register, login, logout, dan pemulihan session melalui refresh token.
- List artikel yang sudah terpublikasi dan detail artikel.
- Pembuatan, pengeditan, publikasi, dan penghapusan artikel milik sendiri.
- Kategori artikel.
- Komentar pada artikel.
- Like dan unlike artikel.
- Bookmark dan remove bookmark artikel.
- Upload cover image atau gambar artikel.

### Out of scope

- Newsletter dan email campaign.
- Paid subscription, payment, dan paywall.
- Rekomendasi artikel berbasis AI.
- Aplikasi mobile native.
- Sistem moderasi dan role administrator yang kompleks.

## 5. Product Principles

- Sederhana untuk digunakan dan dikembangkan.
- Konten artikel disimpan sebagai Markdown.
- File gambar disimpan di object storage, bukan sebagai binary di database.
- Backend menjadi satu-satunya jalur akses aplikasi ke database.
- Keamanan dan ownership diperiksa di backend, bukan hanya melalui UI frontend.

## 6. Implementation Status

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
