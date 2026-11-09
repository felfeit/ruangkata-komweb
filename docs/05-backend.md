# 05: Backend Guide

## 1. Tech Stack and Responsibilities

Backend menggunakan:

- Node.js
- Express.js
- Prisma ORM 6.19.3
- PostgreSQL (Supabase)
- JSON Web Token (JWT)
- bcrypt
- Supabase Storage (untuk penyimpanan file)

Backend bertanggung jawab atas:

- REST API dan validasi request.
- Authentication dan authorization.
- Business logic aplikasi.
- Database access melalui Prisma.
- Upload dan penghapusan file melalui Storage API.
- Error handling dan response yang konsisten.
- Validasi ownership terhadap resource pengguna.

Frontend hanya berkomunikasi dengan Express REST API. Akses database dan Supabase Storage dilakukan melalui backend.

## 2. Backend Project Structure

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── prisma.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── article.controller.js
│   │   └── comment.controller.js
│   │   └── like.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── ownership.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── article.routes.js
│   │   └── comment.routes.js
│   │   └── like.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── article.service.js
│   │   └── comment.service.js
│   │   └── like.service.js
│   ├── utils/
│   │   └── token.util.js
│   ├── app.js
│   └── server.js
├── .env
├── .env.example
├── package.json
└── prisma.config.ts
```

Struktur dapat berkembang ketika fitur baru ditambahkan.

## 3. Layer Responsibilities

- **Routes:** Memetakan HTTP method dan URL ke middleware serta controller.
- **Middlewares:** Menangani autentikasi, authorization, ownership check, dan validasi umum.
- **Controllers:** Membaca request, memanggil service, dan membentuk HTTP response.
- **Services:** Menangani business logic, validasi bisnis, dan operasi database.
- **Config:** Menginisialisasi Prisma dan dependency eksternal.
- **Utils:** Menyediakan helper reusable seperti JWT utility.

Hindari menempatkan seluruh business logic di route atau controller.

## 4. Authentication

Authentication menggunakan custom JWT authentication dengan access token dan refresh token.

Auth endpoints:

| Method | Endpoint                | Fungsi                            |
| ------ | ----------------------- | --------------------------------- |
| POST   | `/api/v1/auth/register` | Registrasi pengguna               |
| POST   | `/api/v1/auth/login`    | Login pengguna                    |
| POST   | `/api/v1/auth/refresh`  | Memperbarui token                 |
| POST   | `/api/v1/auth/logout`   | Logout dan mencabut refresh token |

### Token Configuration

- Access token: 15 menit.
- Refresh token: 14 hari.
- Access token dikirim melalui response JSON dan digunakan pada Authorization header.
- Refresh token disimpan di cookie HttpOnly.
- Refresh token disimpan dalam database sebagai SHA-256 hash, bukan plaintext.

Cookie refresh token menggunakan konfigurasi:

- `HttpOnly: true`
- `SameSite: Lax`
- `Secure: true` pada production.
- Path: `/api/v1/auth`

Refresh token menggunakan rotation. Setiap refresh yang berhasil mencabut token sebelumnya dan menerbitkan token baru.

Jika refresh token yang sudah pernah digunakan dipakai kembali, backend melakukan reuse detection dan mencabut sesi aktif milik pengguna tersebut.

Jalankan `require("dotenv").config()` sebelum mengimpor modul yang membaca environment variables ketika module initialization.

## 5. Authentication Middleware

Middleware `authenticateToken` bertanggung jawab untuk:

1. Membaca access token dari `Authorization: Bearer <access_token>`.
2. Memverifikasi signature dan masa berlaku JWT.
3. Memastikan token merupakan access token.
4. Memastikan user yang menjadi subject token masih tersedia di database.
5. Memasang informasi user ke `req.user`.
6. Meneruskan request ke middleware atau controller berikutnya.

Informasi user yang tersedia pada `req.user` saat ini:

- `id`
- `username`
- `email`

Endpoint privat harus menggunakan middleware ini.

Jangan mempercayai `userId` dari request body untuk menentukan pemilik resource. Identitas user harus berasal dari `req.user.id`.

## 6. Authorization and Ownership

Backend menggunakan ownership middleware untuk memastikan pengguna hanya dapat mengubah atau menghapus resource miliknya sendiri.

Middleware yang tersedia:

- `requireArticleOwner`
- `requireCommentOwner`

Keduanya memeriksa resource berdasarkan ID dan user ID yang sedang terautentikasi.

Jika resource tidak ditemukan atau bukan milik pengguna, middleware mengembalikan `404 Not Found`.

Pendekatan ini menghindari pengungkapan apakah resource milik pengguna lain benar-benar tersedia.

Ownership check juga dilakukan pada operasi penghapusan di service layer sebagai lapisan perlindungan tambahan.

## 7. Article Module

Article service menangani operasi:

- Create Article.
- Get Published Articles.
- Get Published Article Detail.
- Get My Articles.
- Update Article.
- Delete Article.

### Article Business Rules

- Artikel baru dapat dibuat oleh pengguna terautentikasi.
- `userId` artikel berasal dari access token.
- Judul wajib diisi dan maksimal 255 karakter.
- Konten Markdown wajib diisi.
- Artikel memiliki status `DRAFT` atau `PUBLISHED`.
- `categoryId` bersifat opsional dan harus merujuk kategori yang tersedia.
- Artikel publik hanya menampilkan artikel berstatus `PUBLISHED`.
- Artikel draft tidak ditampilkan pada endpoint publik.
- Pengguna hanya dapat mengubah atau menghapus artikel miliknya.
- `publishedAt` diatur ketika artikel diterbitkan dan diperbarui ketika status publikasi berubah.

Slug dibuat secara unik ketika artikel dibuat dan dipertahankan ketika artikel diperbarui.

## 8. Comment Module

Comment service menangani operasi:

- Create Comment.
- Get Comments.
- Update Comment.
- Delete Comment.

### Comment Business Rules

#### Create Comment

- Hanya pengguna terautentikasi yang dapat membuat komentar.
- `userId` berasal dari access token.
- `articleId` berasal dari URL parameter.
- Komentar hanya dapat dibuat pada artikel berstatus `PUBLISHED`.
- Content wajib berupa string yang tidak kosong.
- Content maksimal 5000 karakter.

#### Read Comments

- Dapat diakses secara publik tanpa login.
- Hanya komentar dari artikel berstatus `PUBLISHED` yang dapat ditampilkan.
- Default pagination: page 1, limit 10.
- Maksimal limit: 50.
- Urutan komentar: terbaru ke terlama (`createdAt DESC`).

#### Update Comment

- Hanya pemilik komentar yang dapat mengubahnya.
- Pengubahan komentar hanya diizinkan dalam 15 menit sejak komentar dibuat.
- Pengguna dapat mengubah komentar berkali-kali selama masih dalam batas waktu.
- Batas waktu dihitung berdasarkan `createdAt`, bukan `updatedAt`.
- Content wajib berupa string yang tidak kosong dan maksimal 5000 karakter.
- Jika melewati batas waktu, backend mengembalikan `403 Forbidden`.

#### Delete Comment

- Hanya pemilik komentar yang dapat menghapusnya.
- Komentar dapat dihapus kapan saja.
- Tidak ada batas waktu penghapusan.
- Komentar yang tidak ditemukan atau bukan milik pengguna menghasilkan `404 Not Found`.

## 9. Like Module

Like service menangani operasi:

- Create Like.
- Delete Like.
- Get Like Count.
- Get Like Status.

### Like Business Rules

#### Create Like

- Hanya pengguna terautentikasi yang dapat memberikan like.
- `userId` berasal dari access token.
- `articleId` berasal dari URL parameter.
- Like hanya dapat diberikan pada artikel berstatus `PUBLISHED`.
- Satu pengguna hanya dapat memberikan satu like pada artikel yang sama.
- Like duplikat menghasilkan `409 Conflict`.

#### Delete Like

- Hanya pengguna terautentikasi yang dapat menghapus like.
- Penghapusan hanya berlaku pada like milik pengguna tersebut.
- Unlike dapat dilakukan kapan saja.
- Jika pengguna belum memberikan like, request tetap berhasil dengan status unlike.

#### Read Like Count

- Dapat diakses secara publik tanpa login.
- Hanya artikel berstatus `PUBLISHED` yang dapat dihitung.
- Mengembalikan jumlah seluruh like pada artikel.

#### Read Like Status

- Membutuhkan access token.
- Status like diperiksa berdasarkan kombinasi `userId` dan `articleId`.
- Mengembalikan `isLiked: true` jika pengguna sudah memberikan like, dan `false` jika belum.

## 9. Error Handling

Error handling terpusat berada di `app.js`.

Format response error:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

Error malformed JSON ditangani secara khusus dan mengembalikan `400 Bad Request`.

Untuk error lainnya, backend menggunakan `statusCode` yang diberikan service atau middleware.

Error server dengan status 500 atau lebih tidak mengekspos detail exception kepada client.

Jangan mengembalikan stack trace, detail SQL, secret, password hash, atau refresh token hash pada production.

## 10. Validation and Security Checklist

Sebelum API dianggap siap:

- Validasi tipe, panjang, dan format setiap input.
- Normalisasi email dan username.
- Validasi UUID pada route parameter.
- Batasi ukuran request body dan upload.
- Terapkan rate limit terutama pada authentication dan upload.
- Gunakan parameterized ORM queries.
- Sanitasi konten Markdown ketika dirender menjadi HTML.
- Jangan mengembalikan password hash atau token hash.
- Jangan log password, token, cookie, atau secret.
- Terapkan authentication dan ownership check pada seluruh endpoint privat.
- Pastikan credential database dan Storage tidak pernah diekspos ke frontend.

## 11. Environment Variables

Environment variables disimpan di `.env` dan tidak boleh di-commit ke repository.

Contoh konfigurasi:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d
```

Gunakan `.env.example` sebagai template tanpa credential asli.

Jangan pernah membagikan atau meng-commit isi `.env`.

## 12. Current Implementation Status

| Module         | Status Implementasi     | Status Pengujian                    |
| -------------- | ----------------------- | ----------------------------------- |
| Prisma Setup   | Implemented             | Initial migration berhasil          |
| Authentication | Implemented             | Seluruh simulasi pengujian berhasil |
| Article CRUD   | Implemented             | Seluruh simulasi pengujian berhasil |
| Comment CRUD   | Implemented             | Seluruh simulasi pengujian berhasil |
| Image Upload   | Belum diimplementasikan | Seluruh simulasi pengujian berhasil |
| Image Deletion | Belum diimplementasikan | Belum diuji                         |
| Like           | Belum diimplementasikan | Belum diuji                         |
| Bookmark       | Belum diimplementasikan | Belum diuji                         |

Status implementasi berarti kode fitur sudah dibuat, bukan berarti seluruh skenario pengujiannya sudah lulus.

## 13. Development and Migration Policy

- Setiap perubahan schema harus memiliki migration bernama.
- Commit file migration bersama perubahan kode.
- Jangan mengubah migration yang sudah diterapkan di environment bersama.
- Buat migration baru untuk perubahan schema berikutnya.
- Review SQL hasil generate sebelum menerapkan perubahan sensitif.
- Pastikan dokumentasi tetap selaras dengan `schema.prisma`, migration, dan implementasi API.
