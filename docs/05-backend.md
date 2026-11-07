# 05: Backend Guide

## 1. Tech Stack and Responsibilities

Backend menggunakan Node.js, Express.js, Prisma 6.19.3, PostgreSQL, JSON Web Token, dan Supabase Storage.

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

## 3. Layer Responsibiliie

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
- Gunakan error response yang
