# 03: System Architecture

## 1. High-level architecture

```text
Browser
  |
  | React UI + API requests
  v
Express REST API (Node.js)
  |                 |
  | Prisma          | Supabase Storage API
  v                 v
Supabase            article-images bucket
PostgreSQL
```

Frontend tidak mengakses Supabase Database secara langsung. Semua operasi database dilakukan melalui Express API dan Prisma.

## 2. Technology Decisions

| Concern        | Decision                  | Reason                                             |
| -------------- | ------------------------- | -------------------------------------------------- |
| Frontend       | React + Vite + JavaScript | Ringan dan familiar                                |
| Backend        | Node.js + Express         | REST API sederhana                                 |
| ORM            | Prisma 6.19.3             | Schema, migration, dan typed query                 |
| Database       | Supabase PostgreSQL       | Managed PostgreSQL                                 |
| Image storage  | Supabase Storage          | Memisahkan file dari database                      |
| Authentication | Custom JWT                | Access token + refresh cookie                      |
| Deployment     | Render                    | Satu service dapat melayani frontend build dan API |

## 3. Repository Boundaries

- `frontend/`: UI, Routing, State, Form, dan API Client.
- `server/`: Express Routes/Controllers/Services, Middleware, Prisma, dan Integrasi Supabase Storage Bucket.
- `docs/`: Dokumentasi dan Contract untuk Tim.

## 4. Request Flow

### Public Request

1. Browser mengirim request ke endpoint publik.
2. Express menerima request melalui route.
3. Controller memanggil service.
4. Service mengakses database melalui Prisma.
5. API mengembalikan JSON.

### Private Request

1. Frontend mengirim header `Authorization: Bearer <accessToken>`.
2. Authentication middleware memverifikasi JWT access token.
3. Middleware mengambil identitas user dan memasangnya ke `req.user`.
4. Authorization/ownership check memastikan user boleh melakukan operasi.
5. Controller/service menjalankan operasi.

## 5. Authentication Design

- Access token: JSON Web Token, berdurasi 15 menit, dikirim ke Authorization Header untuk bisa mengakses Private Request.
- Refresh token: JSON Web Token, 14 hari, disimpan di cookie `HttpOnly`.
- Refresh token disimpan di database dalam bentuk SHA-256 hash.
- Setiap refresh yang berhasil mencabut token lama dan menerbitkan token baru.
- Reuse token yang sudah dicabut akan ditolak dan memicu mekanisme revoke sesi aktif sesuai implementasi service.

Cookie saat ini dirancang untuk satu origin dengan `SameSite=Lax`. Jika frontend dan API dipisah ke site berbeda, konfigurasi cookie, CORS credentials, dan proteksi CSRF harus ditinjau ulang.

## 6. Database Access and Row Level Security

Supabase RLS diaktifkan pada tabel aplikasi dan privilege akses langsung `anon`/`authenticated` dicabut. Express/Prisma adalah trusted access path dan menggunakan credential database server-side.

Koneksi backend dengan role database privileged dapat melewati RLS. Karena itu, RLS bukan pengganti authentication dan authorization di Express. Backend wajib memvalidasi user dan ownership.

## 7. Image Storage

- Bucket: `article-images`.
- Format gambar yang diterima: JPEG, PNG, WebP.
- Batas ukuran gambar yang boleh diupload: 10 MB.
- File disimpan di Supabase Storage.
- Database menyimpan storage path, bukan binary.
- Bucket publik berarti file yang memiliki URL dapat dilihat publik. Jangan simpan gambar privat di bucket ini.
- Service-role/secret key hanya boleh berada di backend.

## 8. Deployment Target

Target awal adalah satu Render Web Service:

- Build frontend menjadi static assets.
- Express melayani API dan hasil build frontend dari domain yang sama.
- Supabase menyediakan PostgreSQL dan Storage.

Detail konfigurasi build/start perlu disesuaikan dengan `package.json` dan struktur repository aktual sebelum deploy.
