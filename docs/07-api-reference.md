# 07: API Reference

## 1. Conventions

- Base path: `/api/v1`
- Format request/response: JSON, kecuali endpoint yang menangani multipart upload.
- Authentication: `Authorization: Bearer <accessToken>`.
- Refresh token dikirim browser lewat cookie `HttpOnly`.
- Ketersediaan endpoint harus dicek terhadap implementasi backend saat ini. Endpoint berstatus planned di bawah belum tentu sudah ada.

## 2. Authentication Endpoints

### POST `/auth/register`

Mendaftarkan user baru.

Request:

```json
{
  "name": "Example User",
  "username": "example",
  "email": "example@example.com",
  "password": "password123"
}
```

Response sukses: `201 Created`.

Bentuk response (ilustrasi):

```json
{
  "success": true,
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

Refresh token dipasang di cookie HttpOnly dan tidak dikembalikan sebagai field JSON.

Error yang mungkin muncul: `400` input tidak valid, `409` email/username duplikat.

### POST `/auth/login`

Login dengan email atau username.

Request:

```json
{
  "identifier": "example",
  "password": "password123"
}
```

Response sukses: `200 OK`. Response berisi data user dan access token; refresh token dipasang sebagai cookie HttpOnly.

Error yang mungkin muncul: `401` kredensial tidak valid.

### POST `/auth/refresh`

Mengambil access token baru menggunakan refresh cookie.

- Tidak memerlukan JSON body.
- Browser harus mengirim credentials/cookie.
- Jika berhasil, refresh token lama dicabut dan refresh token baru dipasang.
- Response sukses: `200 OK`.
- Token tidak valid, expired, atau sudah dicabut: `401 Unauthorized`.

### POST `/auth/logout`

Mencabut refresh token yang terkait dengan cookie dan menghapus cookie tersebut.

- Tidak memerlukan JSON body.
- Response sukses: `200 OK`.
- Logout harus aman dipanggil walaupun tidak ada refresh cookie.

## 3. Authentication Header Example

```http
Authorization: Bearer <access_token>
```

Jangan kirim refresh token di Authorization header pada request API biasa.

## 4. Planned Article Endpoints

Route resource di bawah masih usulan dan harus dikonfirmasi di implementasi sebelum frontend mengintegrasikannya.

| Method | Path                    | Access        | Fungsi                      |
| ------ | ----------------------- | ------------- | --------------------------- |
| GET    | `/articles`             | Public        | Daftar artikel terpublikasi |
| GET    | `/articles/:slug`       | Public        | Detail artikel              |
| POST   | `/articles`             | Authenticated | Membuat artikel/draft       |
| PATCH  | `/articles/:id`         | Owner         | Mengubah artikel            |
| DELETE | `/articles/:id`         | Owner         | Menghapus artikel           |
| POST   | `/articles/:id/publish` | Owner         | Menerbitkan artikel         |

## 5. Planned Interaction Endpoints

| Method | Path                     | Access        | Fungsi                     |
| ------ | ------------------------ | ------------- | -------------------------- |
| GET    | `/articles/:id/comments` | Public        | Daftar komentar            |
| POST   | `/articles/:id/comments` | Authenticated | Menambah komentar          |
| DELETE | `/comments/:id`          | Owner         | Menghapus komentar sendiri |
| PUT    | `/articles/:id/like`     | Authenticated | Like artikel               |
| DELETE | `/articles/:id/like`     | Authenticated | Unlike artikel             |
| PUT    | `/articles/:id/bookmark` | Authenticated | Bookmark artikel           |
| DELETE | `/articles/:id/bookmark` | Authenticated | Hapus bookmark             |

Path final, pagination, sorting, response envelope, dan error validasi harus disepakati frontend dan backend sebelum implementasi.

## 6. Error Response Convention

Bentuk yang direkomendasikan agar konsisten:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

Jangan ekspos stack trace, detail SQL, secret, atau pesan exception internal di production.
