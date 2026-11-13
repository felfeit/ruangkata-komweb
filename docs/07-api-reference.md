# 07: API Reference

## 1. API Conventions

Base URL:

```text
/api/v1
```

Format request dan response menggunakan JSON, kecuali endpoint yang menangani multipart upload.

Authentication menggunakan:

```http
Authorization: Bearer <access_token>
```

Refresh token dikirim melalui cookie HttpOnly dan tidak digunakan sebagai Bearer token pada request API biasa.

### Response Convention

Response sukses umumnya menggunakan:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Response error:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

Endpoint tertentu dapat mengembalikan metadata tambahan seperti `pagination`.

## 2. Authentication Endpoints

### POST `/auth/register`

Mendaftarkan user baru.

Access: Public.

Request:

```json
{
  "name": "Example User",
  "username": "example",
  "email": "example@example.com",
  "password": "password123"
}
```

Success: `201 Created`.

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Example User",
      "username": "example",
      "email": "example@example.com"
    },
    "accessToken": "..."
  }
}
```

Refresh token dipasang pada cookie HttpOnly dan tidak dikembalikan sebagai field JSON.

Validasi:

- Name: 2–100 karakter.
- Username: 3–30 karakter, huruf kecil, angka, dan underscore.
- Email: format email valid, maksimal 254 karakter.
- Password: minimal 8 karakter dan maksimal 72 byte.

Possible errors:

| Status | Kondisi                             |
| ------ | ----------------------------------- |
| 400    | Input tidak valid                   |
| 409    | Email atau username sudah digunakan |
| 500    | Internal server error               |

### POST `/auth/login`

Login menggunakan email atau username.

Access: Public.

Request:

```json
{
  "identifier": "example",
  "password": "password123"
}
```

Success: `200 OK`.

Response berisi data user dan access token. Refresh token dipasang melalui cookie HttpOnly.

Possible errors:

| Status | Kondisi                |
| ------ | ---------------------- |
| 400    | Input tidak valid      |
| 401    | Kredensial tidak valid |
| 500    | Internal server error  |

### POST `/auth/refresh`

Memperbarui access token menggunakan refresh cookie.

Access: Refresh cookie required.

Request body tidak diperlukan.

Browser harus mengirim cookie yang berlaku.

Success: `200 OK`.

Ketika berhasil:

- Refresh token lama dicabut.
- Refresh token baru diterbitkan.
- Cookie refresh token diperbarui.
- Access token baru dikembalikan.

Possible errors:

| Status | Kondisi                                                       |
| ------ | ------------------------------------------------------------- |
| 401    | Refresh token tidak ada, invalid, expired, atau sudah dicabut |
| 500    | Internal server error                                         |

### POST `/auth/logout`

Logout dan mencabut refresh token yang digunakan.

Access: Refresh cookie optional.

Request body tidak diperlukan.

Success: `200 OK`.

Backend mencabut refresh token yang terkait dengan cookie jika tersedia dan menghapus cookie pada response.

Endpoint ini dirancang agar tetap aman dipanggil ketika refresh cookie tidak tersedia.

## 3. Authentication Header

Endpoint privat menggunakan header:

```http
Authorization: Bearer <access_token>
```

Ketentuan:

- Access token harus valid dan belum kedaluwarsa.
- Token harus merupakan access token.
- User yang menjadi subject token harus masih tersedia.
- Refresh token tidak boleh digunakan pada Authorization header.

## 4. Article Endpoints

### GET `/articles`

Mendapatkan daftar artikel yang sudah dipublikasikan.

Access: Public.

Query parameters:

| Parameter | Default | Keterangan                              |
| --------- | ------: | --------------------------------------- |
| `page`    |       1 | Nomor halaman                           |
| `limit`   |      10 | Jumlah artikel per halaman, maksimal 50 |
| `search`  |       - | Pencarian berdasarkan judul             |

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Example Article",
      "slug": "example-article",
      "contentMarkdown": "...",
      "status": "PUBLISHED",
      "publishedAt": "2026-11-08T10:00:00.000Z",
      "author": {
        "id": "uuid",
        "name": "Example User",
        "username": "example"
      },
      "category": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Hanya artikel dengan status `PUBLISHED` yang ditampilkan.

### GET `/articles/:articleId`

Mendapatkan detail artikel berdasarkan slug atau UUID.

Access: Public.

Success: `200 OK`.

Hanya artikel dengan status `PUBLISHED` yang dapat diakses.

Possible errors:

- `404 Not Found`: artikel tidak ditemukan atau masih draft.

### GET `/articles/my`

Mendapatkan daftar artikel milik user yang sedang login.

Access: Authenticated.

Query parameters:

| Parameter | Default | Keterangan                              |
| --------- | ------: | --------------------------------------- |
| `page`    |       1 | Nomor halaman                           |
| `limit`   |      10 | Jumlah artikel per halaman, maksimal 50 |
| `status`  |       - | Filter `DRAFT` atau `PUBLISHED`         |

Success: `200 OK`.

Endpoint ini dapat menampilkan artikel draft dan published milik user yang terautentikasi.

### POST `/articles`

Membuat artikel baru.

Access: Authenticated.

Request:

```json
{
  "title": "Example Article",
  "contentMarkdown": "# Hello World",
  "categoryId": null,
  "status": "DRAFT"
}
```

Success: `201 Created`.

Ketentuan:

- Title wajib dan maksimal 255 karakter.
- Content Markdown wajib diisi.
- Status harus `DRAFT` atau `PUBLISHED`.
- Category ID bersifat opsional.
- User ID diambil dari access token.
- Slug dibuat secara unik oleh backend.

### PUT `/articles/:articleId`

Memperbarui artikel milik user.

Access: Article Owner.

Request dapat berisi field yang ingin diperbarui.

Contoh:

```json
{
  "title": "Updated Article Title",
  "contentMarkdown": "# Updated Content",
  "status": "PUBLISHED"
}
```

Success: `200 OK`.

Ketentuan:

- Hanya pemilik artikel yang dapat memperbarui artikel.
- Field yang tidak dikirim tidak perlu diubah.
- Status harus valid.
- Slug yang sudah dibuat tidak berubah ketika artikel diperbarui.
- `publishedAt` diperbarui ketika status publikasi berubah.

Possible errors:

- `400 Bad Request`: input tidak valid.
- `401 Unauthorized`: access token tidak valid atau tidak tersedia.
- `404 Not Found`: artikel tidak ditemukan atau bukan milik user.
- `409 Conflict`: konflik unique constraint.

### DELETE `/articles/:articleId`

Menghapus artikel milik user.

Access: Article Owner.

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "message": "Article deleted successfully",
  "data": {
    "id": "uuid"
  }
}
```

Penghapusan artikel juga menghapus komentar, like, dan bookmark terkait melalui cascade database.

## 5. Comment Endpoints

### POST `/comments/articles/:articleId`

Membuat komentar pada artikel.

Access: Authenticated.

Request:

```json
{
  "content": "Artikel ini memberikan perspektif yang menarik."
}
```

Success: `201 Created`.

Response:

```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "articleId": "uuid",
    "content": "Artikel ini memberikan perspektif yang menarik.",
    "createdAt": "2026-11-08T10:00:00.000Z",
    "updatedAt": "2026-11-08T10:00:00.000Z",
    "author": {
      "id": "uuid",
      "name": "Example User",
      "username": "example"
    },
    "article": {
      "id": "uuid",
      "title": "Example Article",
      "slug": "example-article"
    }
  }
}
```

Business rules:

- User harus login.
- Article ID berasal dari URL.
- User ID berasal dari access token.
- Artikel harus berstatus `PUBLISHED`.
- Content tidak boleh kosong.
- Maksimal content adalah 5000 karakter.

Possible errors:

| Status | Kondisi                                               |
| ------ | ----------------------------------------------------- |
| 400    | Body tidak valid atau content tidak memenuhi validasi |
| 401    | Tidak ada access token atau token tidak valid         |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan     |
| 500    | Internal server error                                 |

### GET `/comments/articles/:articleId`

Mendapatkan daftar komentar pada artikel.

Access: Public.

Query parameters:

| Parameter | Default | Keterangan                               |
| --------- | ------: | ---------------------------------------- |
| `page`    |       1 | Nomor halaman                            |
| `limit`   |      10 | Jumlah komentar per halaman, maksimal 50 |

Contoh:

```http
GET /comments/articles/{articleId}?page=1&limit=10
```

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "articleId": "uuid",
      "content": "Artikel yang menarik.",
      "createdAt": "2026-11-08T10:00:00.000Z",
      "updatedAt": "2026-11-08T10:00:00.000Z",
      "author": {
        "id": "uuid",
        "name": "Example User",
        "username": "example"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Business rules:

- Tidak membutuhkan access token.
- Artikel harus berstatus `PUBLISHED`.
- Komentar diurutkan berdasarkan `createdAt DESC`.
- Komentar ditampilkan dengan informasi author.
- Jika belum ada komentar, `data` berupa array kosong.

Possible errors:

- `400 Bad Request`: parameter pagination tidak valid.
- `404 Not Found`: artikel tidak ditemukan atau belum dipublikasikan.

### PUT `/comments/:commentId`

Memperbarui komentar milik user.

Access: Comment Owner.

Request:

```json
{
  "content": "Saya sudah memperbarui komentar ini."
}
```

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "articleId": "uuid",
    "content": "Saya sudah memperbarui komentar ini.",
    "createdAt": "2026-11-08T10:00:00.000Z",
    "updatedAt": "2026-11-08T10:05:00.000Z",
    "author": {
      "id": "uuid",
      "name": "Example User",
      "username": "example"
    }
  }
}
```

Business rules:

- User harus login.
- Hanya pemilik komentar yang dapat mengubah komentar.
- Update hanya diizinkan dalam 15 menit sejak komentar dibuat.
- Pengguna dapat mengubah komentar berkali-kali selama batas waktu belum terlewati.
- Batas waktu dihitung dari `createdAt`, bukan `updatedAt`.
- Content tidak boleh kosong.
- Maksimal content adalah 5000 karakter.

Possible errors:

| Status | Kondisi                                        |
| ------ | ---------------------------------------------- |
| 400    | Request body atau content tidak valid          |
| 401    | Access token tidak valid atau tidak tersedia   |
| 403    | Batas waktu edit 15 menit telah terlewati      |
| 404    | Komentar tidak ditemukan atau bukan milik user |

### DELETE `/comments/:commentId`

Menghapus komentar milik user.

Access: Comment Owner.

Request body tidak diperlukan.

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": {
    "id": "uuid"
  }
}
```

Business rules:

- User harus login.
- Hanya pemilik komentar yang dapat menghapus komentar.
- Penghapusan dapat dilakukan kapan saja.
- Tidak ada batas waktu 15 menit untuk penghapusan.
- Komentar yang sudah dihapus tidak dapat dihapus kembali.

Possible errors:

| Status | Kondisi                                        |
| ------ | ---------------------------------------------- |
| 401    | Access token tidak valid atau tidak tersedia   |
| 404    | Komentar tidak ditemukan atau bukan milik user |
| 500    | Internal server error                          |

## 6. Like Endpoints

### POST `/likes/articles/:articleId`

Memberikan like pada artikel.

Access: Authenticated.

Request body tidak diperlukan.

Success: `201 Created`.

Response:

```json
{
  "success": true,
  "message": "Article liked successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "articleId": "uuid",
    "createdAt": "2026-11-09T10:00:00.000Z"
  }
}
```

Business rules:

- User harus login.
- User ID berasal dari access token.
- Article ID berasal dari URL parameter.
- Artikel harus berstatus `PUBLISHED`.
- Satu user hanya dapat memberikan satu like pada artikel yang sama.
- Like duplikat menghasilkan `409 Conflict`.

Possible errors:

| Status | Kondisi                                           |
| ------ | ------------------------------------------------- |
| 401    | Access token tidak valid atau tidak tersedia      |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan |
| 409    | User sudah memberikan like pada artikel tersebut  |
| 500    | Internal server error                             |

### DELETE `/likes/articles/:articleId`

Menghapus like dari artikel.

Access: Authenticated.

Request body tidak diperlukan.

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "message": "Article unliked successfully",
  "data": {
    "articleId": "uuid",
    "isLiked": false
  }
}
```

Business rules:

- User harus login.
- User ID berasal dari access token.
- Artikel harus berstatus `PUBLISHED`.
- User hanya dapat menghapus like miliknya sendiri.
- Jika user belum memberikan like, request tetap berhasil.
- Operasi unlike bersifat idempotent.

Possible errors:

| Status | Kondisi                                           |
| ------ | ------------------------------------------------- |
| 401    | Access token tidak valid atau tidak tersedia      |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan |
| 500    | Internal server error                             |

### GET `/likes/articles/:articleId`

Mendapatkan jumlah like pada artikel.

Access: Public.

Request body tidak diperlukan.

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "data": {
    "articleId": "uuid",
    "totalLikes": 10
  }
}
```

Business rules:

- Tidak membutuhkan access token.
- Artikel harus berstatus `PUBLISHED`.
- Mengembalikan jumlah seluruh like pada artikel.
- Jika belum ada like, `totalLikes` bernilai `0`.

Possible errors:

| Status | Kondisi                                           |
| ------ | ------------------------------------------------- |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan |
| 500    | Internal server error                             |

### GET `/likes/articles/:articleId/me`

Mengecek apakah user yang sedang login sudah memberikan like pada artikel.

Access: Authenticated.

Request body tidak diperlukan.

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "data": {
    "articleId": "uuid",
    "isLiked": true
  }
}
```

Business rules:

- Membutuhkan access token.
- Status like diperiksa berdasarkan kombinasi user ID dan article ID.
- Mengembalikan `isLiked: true` jika user sudah memberikan like.
- Mengembalikan `isLiked: false` jika user belum memberikan like.
- Artikel harus berstatus `PUBLISHED`.

Possible errors:

| Status | Kondisi                                           |
| ------ | ------------------------------------------------- |
| 401    | Access token tidak valid atau tidak tersedia      |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan |
| 500    | Internal server error                             |

## 7. Bookmark Endpoints

### POST `/bookmarks/articles/:articleId`

Menyimpan artikel ke bookmark.

Access: Authenticated.

Request body tidak diperlukan.

Success: `201 Created`.

Response:

```json
{
  "success": true,
  "message": "Article bookmarked successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "articleId": "uuid",
    "createdAt": "2026-11-13T10:00:00.000Z"
  }
}
```

Business rules:

- User harus login.
- User ID berasal dari access token.
- Article ID berasal dari URL parameter.
- Artikel harus berstatus `PUBLISHED`.
- Satu user hanya dapat menyimpan satu bookmark pada artikel yang sama.
- Bookmark duplikat menghasilkan `409 Conflict`.

Possible errors:

| Status | Kondisi                                           |
| ------ | ------------------------------------------------- |
| 401    | Access token tidak valid atau tidak tersedia      |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan |
| 409    | User sudah menyimpan artikel tersebut             |
| 500    | Internal server error                             |

### DELETE `/bookmarks/articles/:articleId`

Menghapus bookmark dari artikel.

Access: Authenticated.

Request body tidak diperlukan.

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "message": "Bookmark removed successfully",
  "data": {
    "articleId": "uuid",
    "isBookmarked": false
  }
}
```

Business rules:

- User harus login.
- User ID berasal dari access token.
- Artikel harus berstatus `PUBLISHED`.
- User hanya dapat menghapus bookmark miliknya sendiri.
- Jika bookmark tidak ditemukan, request tetap berhasil.
- Operasi penghapusan bookmark bersifat idempotent.

Possible errors:

| Status | Kondisi                                           |
| ------ | ------------------------------------------------- |
| 401    | Access token tidak valid atau tidak tersedia      |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan |
| 500    | Internal server error                             |

### GET `/bookmarks/my`

Mendapatkan daftar bookmark milik user yang sedang login.

Access: Authenticated.

Query parameters:

| Parameter | Default | Keterangan                               |
| --------- | ------: | ---------------------------------------- |
| `page`    |       1 | Nomor halaman                            |
| `limit`   |      10 | Jumlah bookmark per halaman, maksimal 50 |

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "articleId": "uuid",
      "createdAt": "2026-11-13T10:00:00.000Z",
      "article": {
        "id": "uuid",
        "title": "Example Article",
        "slug": "example-article",
        "author": {
          "id": "uuid",
          "name": "Example User",
          "username": "example"
        },
        "category": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Business rules:

- User harus login.
- User hanya dapat melihat bookmark miliknya sendiri.
- Hanya artikel berstatus `PUBLISHED` yang ditampilkan.
- Daftar bookmark diurutkan berdasarkan `createdAt DESC`.
- Pagination menggunakan default page 1 dan limit 10.
- Maksimal limit adalah 50.
- Data artikel mencakup informasi author dan category.

Possible errors:

| Status | Kondisi                                      |
| ------ | -------------------------------------------- |
| 400    | Parameter pagination tidak valid             |
| 401    | Access token tidak valid atau tidak tersedia |
| 500    | Internal server error                        |

### GET `/bookmarks/articles/:articleId`

Memeriksa status bookmark user pada artikel.

Access: Authenticated.

Request body tidak diperlukan.

Success: `200 OK`.

Response:

```json
{
  "success": true,
  "data": {
    "articleId": "uuid",
    "isBookmarked": true
  }
}
```

Business rules:

- User harus login.
- Status bookmark diperiksa berdasarkan kombinasi user ID dan article ID.
- Mengembalikan `isBookmarked: true` jika artikel sudah disimpan.
- Mengembalikan `isBookmarked: false` jika artikel belum disimpan.
- Artikel harus berstatus `PUBLISHED`.

Possible errors:

| Status | Kondisi                                           |
| ------ | ------------------------------------------------- |
| 401    | Access token tidak valid atau tidak tersedia      |
| 404    | Artikel tidak ditemukan atau belum dipublikasikan |
| 500    | Internal server error                             |

## 8. Error Response Convention

Format error umum:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

HTTP status code yang digunakan:

| Status | Makna                                              |
| ------ | -------------------------------------------------- |
| 200    | Request berhasil                                   |
| 201    | Resource berhasil dibuat                           |
| 400    | Request atau input tidak valid                     |
| 401    | Authentication diperlukan atau token tidak valid   |
| 403    | Akses ditolak karena aturan bisnis atau permission |
| 404    | Resource tidak ditemukan atau bukan milik user     |
| 409    | Konflik data, misalnya unique constraint           |
| 500    | Internal server error                              |

Backend tidak boleh mengekspos stack trace, detail SQL, secret, password hash, atau informasi internal lainnya pada production.

## 9. Current API Implementation Status

| Module   | Endpoint                     | Status      |
| -------- | ---------------------------- | ----------- |
| Auth     | Register                     | Implemented |
| Auth     | Login                        | Implemented |
| Auth     | Refresh                      | Implemented |
| Auth     | Logout                       | Implemented |
| Article  | Get Published Articles       | Implemented |
| Article  | Get Published Article Detail | Implemented |
| Article  | Get My Articles              | Implemented |
| Article  | Create Article               | Implemented |
| Article  | Update Article               | Implemented |
| Article  | Delete Article               | Implemented |
| Comment  | Create Comment               | Implemented |
| Comment  | Get Comments                 | Implemented |
| Comment  | Update Comment               | Implemented |
| Comment  | Delete Comment               | Implemented |
| Like     | Create Like                  | Implemented |
| Like     | Delete Like                  | Implemented |
| Like     | Get Like Count               | Implemented |
| Like     | Get Like Status              | Implemented |
| Bookmark | Create Bookmark              | Implemented |
| Bookmark | Delete Bookmark              | Implemented |
| Bookmark | Get My Bookmarks             | Implemented |
| Bookmark | Get Bookmark Status          | Implemented |

Status `Implemented` menunjukkan endpoint sudah dibuat dalam kode backend. Status tersebut belum berarti seluruh test case telah dijalankan dan dinyatakan lulus.

## 10. API Testing Notes

Pengujian API dilakukan menggunakan Postman atau Thunder Client sebelum frontend melakukan integrasi.

Pengujian mencakup:

- Validasi request body dan query parameters.
- Authentication dan token expiration.
- Authorization dan ownership.
- Resource not found.
- Pagination dan sorting.
- Business rules setiap fitur.
- Konsistensi HTTP status code dan response.
- Error handling.

### Completed Test Results

Pengujian yang telah berhasil diselesaikan:

- Authentication: Register, Login, Refresh Token Rotation, dan Logout.
- Article CRUD: Create, Read, Update, dan Delete.
- Comment CRUD: Create, Read, Update, dan Delete.
- Like: Create Like, Duplicate Like Prevention, Delete Like, Get Like Count, dan Get Like Status.
- Bookmark: Create Bookmark, Duplicate Bookmark Prevention, Delete Bookmark, Get My Bookmarks, Pagination, Get Bookmark Status, dan User Data Isolation.

Hasil pengujian aktual dicatat berdasarkan endpoint dan skenario yang telah dijalankan.
