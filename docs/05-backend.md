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
│   │   ├── prisma.js
│   │   └── supabase.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── article.controller.js
│   │   ├── comment.controller.js
│   │   ├── like.controller.js
│   │   └── bookmark.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── ownership.middleware.js
│   │   └── upload.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── article.routes.js
│   │   ├── comment.routes.js
│   │   ├── like.routes.js
│   │   └── bookmark.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── article.service.js
│   │   ├── comment.service.js
│   │   ├── like.service.js
│   │   ├── bookmark.service.js
│   │   └── storage.service.js
│   ├── utils/
│   │   ├── token.util.js
│   │   └── image.util.js
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

## 10. Bookmark Module

Bookmark service menangani operasi:

- Create Bookmark.
- Delete Bookmark.
- Get My Bookmarks.
- Get Bookmark Status.

### Bookmark Business Rules

#### Create Bookmark

- Hanya pengguna terautentikasi yang dapat menyimpan artikel.
- `userId` berasal dari access token.
- `articleId` berasal dari URL parameter.
- Bookmark hanya dapat dibuat pada artikel berstatus `PUBLISHED`.
- Satu pengguna hanya dapat menyimpan satu bookmark pada artikel yang sama.
- Bookmark duplikat menghasilkan `409 Conflict`.

#### Delete Bookmark

- Hanya pengguna terautentikasi yang dapat menghapus bookmark.
- Penghapusan hanya berlaku pada bookmark milik pengguna tersebut.
- Bookmark dapat dihapus kapan saja.
- Jika bookmark tidak ditemukan, request tetap berhasil dengan status `isBookmarked: false`.

#### Read My Bookmarks

- Membutuhkan access token.
- Pengguna hanya dapat melihat daftar bookmark miliknya sendiri.
- Hanya bookmark dari artikel berstatus `PUBLISHED` yang ditampilkan.
- Menggunakan pagination dengan default page 1 dan limit 10.
- Maksimal limit adalah 50.
- Daftar bookmark diurutkan berdasarkan waktu penyimpanan terbaru (`createdAt DESC`).
- Data artikel mencakup informasi author dan category.

#### Read Bookmark Status

- Membutuhkan access token.
- Status bookmark diperiksa berdasarkan kombinasi `userId` dan `articleId`.
- Mengembalikan `isBookmarked: true` jika artikel sudah disimpan, dan `false` jika belum.

## 11. Image Management

Image management menangani upload, pemrosesan, penyimpanan, penggantian, dan penghapusan gambar melalui Supabase Storage.

Backend menggunakan:

- Multer untuk menerima file upload.
- Sharp untuk validasi, resize, dan kompresi gambar.
- Supabase Storage untuk menyimpan gambar hasil pemrosesan.

### Image Storage Configuration

Aplikasi menggunakan dua public storage bucket:

| Bucket           | Fungsi                         |
| ---------------- | ------------------------------ |
| `profile-images` | Menyimpan foto profil pengguna |
| `article-images` | Menyimpan cover image artikel  |

Kedua bucket menggunakan konfigurasi public sehingga gambar dapat diakses melalui public URL.

Credential Supabase Storage hanya digunakan oleh backend. Secret key tidak boleh diekspos ke frontend.

Database hanya menyimpan storage path gambar, bukan public URL.

### Supported Image Formats

Format gambar input yang didukung:

- JPEG
- PNG
- WebP

Seluruh gambar yang berhasil diproses dikonversi menjadi format WebP.

### Image Processing Rules

Backend menerapkan ketentuan berikut:

| Ketentuan           | Profile Image | Article Cover  |
| ------------------- | ------------- | -------------- |
| Maximum input size  | 10 MB         | 10 MB          |
| Maximum output size | 1 MB          | 1 MB           |
| Maximum dimensions  | 512 × 512 px  | 1600 × 1200 px |
| Output format       | WebP          | WebP           |

Mekanisme pemrosesan:

1. Multer menerima file menggunakan memory storage.
2. File input dibatasi maksimal 10 MB.
3. Sharp memvalidasi metadata dan format gambar.
4. Gambar diputar sesuai orientasi metadata jika diperlukan.
5. Gambar di-resize agar tidak melebihi dimensi maksimal.
6. Gambar dikompresi dan dikonversi menjadi WebP.
7. Hasil pemrosesan harus berukuran maksimal 1 MB.
8. Jika ukuran hasil masih melebihi batas setelah proses kompresi, upload ditolak.

Validasi tidak hanya mengandalkan MIME type dari request. Sharp juga digunakan untuk memeriksa format dan memproses data gambar.

### Profile Image Management

Profile image service menangani:

- Upload Profile Image.
- Replace Profile Image.
- Delete Profile Image.

Business rules:

- User harus terautentikasi.
- User hanya dapat mengelola foto profil miliknya sendiri.
- User ID berasal dari access token.
- Gambar disimpan pada bucket `profile-images`.
- Storage path disimpan pada kolom `profile_image_path`.
- Upload gambar baru dilakukan sebelum database diperbarui.
- Setelah database berhasil diperbarui, gambar lama dihapus dari Storage.
- Jika pembaruan database gagal, backend mencoba menghapus gambar baru yang sudah diunggah untuk mencegah orphaned file.

### Article Cover Image Management

Article service menangani:

- Upload Article Cover Image.
- Replace Article Cover Image.
- Delete Article Cover Image.

Business rules:

- User harus terautentikasi.
- Hanya pemilik artikel yang dapat mengelola cover image.
- Article ID berasal dari URL parameter.
- Gambar disimpan pada bucket `article-images`.
- Storage path disimpan pada kolom `cover_image_path`.
- Upload cover image dilakukan melalui endpoint terpisah dari pembuatan artikel.
- Artikel harus sudah tersedia sebelum cover image dapat diunggah.
- Ketika mengganti cover, backend mengunggah gambar baru dan memperbarui database sebelum menghapus gambar lama.
- Jika pembaruan database gagal, backend mencoba menghapus gambar baru yang sudah diunggah.

### Storage File Naming

File disimpan menggunakan UUID untuk menghindari konflik nama.

Contoh storage path:

```text
profile-images/
└── users/
    └── {userId}/
        └── {imageUuid}.webp

article-images/
└── articles/
    └── {articleId}/
        └── {imageUuid}.webp
```

### Storage Deletion Handling

Penghapusan gambar dari Storage dilakukan setelah database diperbarui.

Jika penghapusan file lama gagal, backend mencatat error pada server log. Operasi database tetap dipertahankan agar referensi gambar aktif tidak menunjuk ke file lama yang sudah digantikan atau dihapus.

Penghapusan file yang gagal dapat meninggalkan orphaned file di Storage dan perlu ditangani melalui proses cleanup jika diperlukan.

## 12. Error Handling

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

Error upload juga ditangani secara khusus:

- Multer error dikembalikan sebagai `400 Bad Request`.
- File yang melebihi batas input 10 MB menghasilkan pesan `Image file must not exceed 10 MB`.
- Format MIME type yang tidak didukung menghasilkan `400 Bad Request`.
- Gambar yang tidak valid atau gagal diproses ditolak oleh image processing utility.

Error server dengan status 500 atau lebih tidak mengekspos detail exception kepada client.

Jangan mengembalikan stack trace, detail SQL, secret, password hash, atau refresh token hash pada production.

## 13. Validation and Security Checklist

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
- Validasi format dan ukuran file upload sebelum diproses.
- Validasi konten gambar menggunakan Sharp, bukan hanya MIME type.
- Kompres gambar di backend dengan batas output maksimal 1 MB.
- Terapkan ownership check pada upload dan penghapusan gambar.
- Jangan mengekspos Supabase Secret Key ke frontend.
- Simpan storage path pada database, bukan public URL.

## 14. Environment Variables

Environment variables disimpan di `.env` dan tidak boleh di-commit ke repository.

Contoh konfigurasi:

```env
PORT=8000
NODE_ENV=development

DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d

SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_ARTICLE_IMAGE_STORAGE_BUCKET=article-images
SUPABASE_PROFILE_IMAGE_STORAGE_BUCKET=profile-images

CLIENT_URL=http://localhost:5173
```

Keterangan:

- `SUPABASE_URL`: URL project Supabase.
- `SUPABASE_SECRET_KEY`: Secret key untuk akses Supabase dari backend.
- `SUPABASE_ARTICLE_IMAGE_STORAGE_BUCKET`: Nama bucket untuk cover image artikel.
- `SUPABASE_PROFILE_IMAGE_STORAGE_BUCKET`: Nama bucket untuk foto profil pengguna.

Gunakan `.env.example` sebagai template tanpa credential asli.

Jangan pernah membagikan atau meng-commit isi `.env`. Supabase Secret Key hanya boleh digunakan pada backend dan tidak boleh dikirim ke frontend.

## 15. Current Implementation Status

| Module                     | Status Implementasi | Status Pengujian                               |
| -------------------------- | ------------------- | ---------------------------------------------- |
| Prisma Setup               | Implemented         | Initial migration berhasil                     |
| Authentication             | Implemented         | Seluruh simulasi pengujian berhasil            |
| Article CRUD               | Implemented         | Seluruh simulasi pengujian berhasil            |
| Comment CRUD               | Implemented         | Seluruh simulasi pengujian berhasil            |
| Like                       | Implemented         | Seluruh simulasi pengujian berhasil            |
| Bookmark                   | Implemented         | Seluruh simulasi pengujian berhasil            |
| Profile Image Upload       | Implemented         | Upload, replace, delete, dan validasi berhasil |
| Article Cover Image Upload | Implemented         | Upload, replace, delete, dan validasi berhasil |

Status implementasi berarti kode fitur sudah dibuat. Status pengujian menunjukkan skenario yang telah dijalankan dan dinyatakan berhasil.

## 16. Development and Migration Policy

- Setiap perubahan schema harus memiliki migration bernama.
- Commit file migration bersama perubahan kode.
- Jangan mengubah migration yang sudah diterapkan di environment bersama.
- Buat migration baru untuk perubahan schema berikutnya.
- Review SQL hasil generate sebelum menerapkan perubahan sensitif.
- Pastikan dokumentasi tetap selaras dengan `schema.prisma`, migration, dan implementasi API.
