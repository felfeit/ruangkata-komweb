# 03 — System Architecture

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

## 2. Technology decisions

| Concern        | Decision                  | Reason                                             |
| -------------- | ------------------------- | -------------------------------------------------- |
| Frontend       | React + Vite + TypeScript | Ringan dan familiar untuk SPA                      |
| Backend        | Node.js + Express         | REST API sederhana                                 |
| ORM            | Prisma 6.19.3             | Schema, migration, dan typed query                 |
| Database       | Supabase PostgreSQL       | Managed PostgreSQL                                 |
| Image storage  | Supabase Storage          | Memisahkan file dari database                      |
| Authentication | Custom JWT                | Access token + refresh cookie                      |
| Deployment     | Render                    | Satu service dapat melayani frontend build dan API |

## 3. Repository boundaries

- `client/`: UI, routing, state, form, dan API client.
- `server/`: Express routes/controllers/services, middleware, Prisma, dan integrasi storage.
- `docs/`: kontrak dan panduan lintas tim.

Nama folder aktual dapat berbeda, tetapi batas tanggung jawab harus tetap jelas.

## 4. Request flow

### Public request

1. Browser mengirim request ke endpoint publik.
2. Express menerima request melalui route.
3. Controller memanggil service.
4. Service mengakses database melalui Prisma.
5. API mengembalikan JSON.

### Private request

1. Frontend mengirim `Authorization: Bearer <accessToken>`.
2. Authentication middleware memverifikasi JWT access token.
3. Middleware mengambil identitas user dan memasangnya ke `req.user`.
4. Authorization/ownership check memastikan user boleh melakukan operasi.
5. Controller/service menjalankan operasi.

## 5. Authentication design

- Access token: JWT, 15 menit, dikirim melalui Authorization header.
- Refresh token: JWT, 14 hari, cookie `HttpOnly`.
- Refresh token disimpan di database dalam bentuk SHA-256 hash.
- Setiap refresh yang berhasil mencabut token lama dan menerbitkan token baru.
- Reuse token yang sudah dicabut ditolak dan memicu mekanisme revoke sesi aktif sesuai implementasi service.

Cookie saat ini dirancang untuk satu origin dengan `SameSite=Lax`. Jika frontend dan API dipisah ke site berbeda, konfigurasi cookie, CORS credentials, dan proteksi CSRF harus ditinjau ulang.

## 6. Database access and RLS

Supabase RLS diaktifkan pada tabel aplikasi dan privilege akses langsung `anon`/`authenticated` dicabut. Express/Prisma adalah trusted access path dan menggunakan credential database server-side.

Penting: koneksi backend dengan role database privileged dapat melewati RLS. Karena itu, RLS bukan pengganti authentication dan authorization di Express. Backend wajib memvalidasi user dan ownership.

## 7. Image storage

- Bucket: `article-images`.
- Format yang direncanakan: JPEG, PNG, WebP.
- Batas ukuran yang direncanakan: 10 MB.
- File disimpan di Supabase Storage.
- Database menyimpan storage path, bukan binary.
- Bucket publik berarti file yang memiliki URL dapat dilihat publik. Jangan simpan gambar privat di bucket ini.
- Service-role/secret key hanya boleh berada di backend.

## 8. Deployment target

Target awal adalah satu Render Web Service:

- Build frontend menjadi static assets.
- Express melayani API dan hasil build frontend dari domain yang sama.
- Supabase menyediakan PostgreSQL dan Storage.

Detail konfigurasi build/start perlu disesuaikan dengan `package.json` dan struktur repository aktual sebelum deploy.
