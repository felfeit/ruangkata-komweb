# 05 — Backend Guide

## 1. Stack and responsibilities

Backend menggunakan Node.js, Express.js, Prisma 6.19.3, PostgreSQL, JWT, dan Supabase Storage.

Backend bertanggung jawab atas:

- REST API dan validasi request.
- Authentication dan authorization.
- Business logic.
- Database access melalui Prisma.
- Upload dan penghapusan file melalui Storage API.
- Error handling dan response konsisten.

## 2. Suggested backend structure

```text
src/
├── config/
│   └── prisma.js
├── controllers/
├── middlewares/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js
prisma/
├── schema.prisma
└── migrations/
```

Pertahankan struktur aktual jika sudah berbeda; yang penting tanggung jawab tiap layer jelas.

## 3. Layer responsibilities

- Routes: memetakan HTTP method/path ke middleware dan controller.
- Middleware: autentikasi, authorization, validasi umum, dan error handling.
- Controllers: membaca request, memanggil service, dan membentuk HTTP response.
- Services: business logic dan transaksi database.
- Config: inisialisasi Prisma dan dependency eksternal.
- Utils: helper reusable seperti token utility.

Hindari menaruh seluruh business logic di route/controller.

## 4. Authentication

Auth endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Token:

- Access token: 15 menit.
- Refresh token: 14 hari.
- Refresh cookie: `HttpOnly`, `SameSite=Lax`; `Secure` aktif di production.
- Refresh token hash disimpan di tabel `refresh_tokens`.

Jalankan `require("dotenv").config()` sebelum mengimpor modul yang membaca environment variables saat module initialization.

## 5. Authorization

Semua endpoint privat harus:

1. Memverifikasi access token.
2. Memastikan subject user masih ada.
3. Memasang user terautentikasi ke `req.user`.
4. Memeriksa ownership atau permission pada resource yang diakses.

Jangan mempercayai `userId` dari body untuk menentukan pemilik resource. Ambil identitas dari `req.user`.

## 6. Validation and security checklist

Sebelum API dianggap siap:

- Validasi tipe, panjang, dan format setiap input.
- Normalisasi email dan username.
- Batasi ukuran request body dan upload.
- Terapkan rate limit terutama pada auth dan upload.
- Gunakan parameterized ORM queries; hindari raw SQL tidak aman.
- Sanitasi konten Markdown saat render.
- Jangan mengembalikan password hash atau token hash.
- Jangan log password, token, cookie, atau secret.
- Gunakan error response yang konsisten.
- Tambahkan CORS hanya untuk origin yang dibutuhkan jika origin terpisah.
- Tinjau CSRF jika konfigurasi cookie menjadi cross-site.

## 7. Prisma workflow

Setelah mengubah schema:

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name descriptive_migration_name
npx prisma generate
```

Perintah generate juga dapat dijalankan secara terpisah setelah perubahan schema. Pastikan generator output dan import Prisma Client di `src/config/prisma.js` konsisten.

Untuk deployment, gunakan migration deploy yang sesuai, bukan `migrate dev`.

## 8. Current status

Implemented and tested:

- Express app/server bootstrap.
- Prisma Client generation and database connection setup.
- Register/login/logout.
- Refresh token rotation and reuse detection.

Next:

- Finalize and test access-token middleware.
- Add authorization and ownership checks.
- Implement article endpoints.
- Implement comments, likes, bookmarks.
- Implement image upload integration.
- Add automated tests and operational hardening.
