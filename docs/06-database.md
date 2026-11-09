# 06: Database

## 1. Database Overview

Aplikasi menggunakan PostgreSQL melalui Supabase.

Prisma ORM 6.19.3 digunakan untuk:

- Mendefinisikan database schema.
- Mengelola relasi dan constraint.
- Menjalankan database query.
- Membuat dan menerapkan migration.
- Menghasilkan Prisma Client.

Database menjadi sumber utama data aplikasi. Seluruh akses database dari frontend dilakukan melalui Express REST API.

## 2. Tables

Database aplikasi memiliki tujuh tabel utama dan satu tabel tambahan untuk manajemen refresh token.

| Table            | Fungsi                                   |
| ---------------- | ---------------------------------------- |
| `users`          | Akun dan profil pengguna                 |
| `categories`     | Kategori artikel                         |
| `articles`       | Konten artikel dan status publikasi      |
| `comments`       | Komentar pengguna pada artikel           |
| `likes`          | Like pengguna pada artikel               |
| `bookmarks`      | Bookmark artikel pengguna                |
| `refresh_tokens` | Hash refresh token dan status pencabutan |

## 3. Main Relationships

```text
users 1 ─── * articles
users 1 ─── * comments
users 1 ─── * likes
users 1 ─── * bookmarks
users 1 ─── * refresh_tokens

categories 1 ─── * articles

articles 1 ─── * comments
articles 1 ─── * likes
articles 1 ─── * bookmarks
```

Keterangan:

- Satu user dapat memiliki banyak artikel.
- Satu user dapat membuat banyak komentar.
- Satu user dapat memberikan banyak like dan bookmark.
- Satu user dapat memiliki banyak refresh token.
- Satu kategori dapat digunakan oleh banyak artikel.
- Satu artikel dapat memiliki banyak komentar, like, dan bookmark.
- Artikel dapat tidak memiliki kategori karena relasi kategori bersifat opsional.

## 4. Important Constraints

### Users

- `id`: UUID primary key.
- `username`: unique.
- `email`: unique.

### Categories

- `id`: UUID primary key.
- `name`: unique.
- `slug`: unique.

### Articles

- `id`: UUID primary key.
- `user_id`: foreign key ke `users.id`.
- `category_id`: nullable foreign key ke `categories.id`.
- `slug`: unique.
- `title`: maksimal 255 karakter.
- `status`: enum `DRAFT` atau `PUBLISHED`.

### Comments

- `id`: UUID primary key.
- `user_id`: foreign key ke `users.id`.
- `article_id`: foreign key ke `articles.id`.
- `content`: text.
- Tidak ada batasan unique pada pasangan user dan artikel karena seorang user boleh membuat beberapa komentar pada artikel yang sama.

### Likes and Bookmarks

- Primary key menggunakan UUID.
- Pasangan `(user_id, article_id)` memiliki unique constraint.
- User hanya dapat memiliki satu like dan satu bookmark untuk artikel yang sama.

### Refresh Tokens

- `id`: UUID primary key.
- `user_id`: foreign key ke `users.id`.
- `token_hash`: unique.
- `expires_at`: waktu kedaluwarsa token.
- `revoked_at`: nullable timestamp pencabutan.

## 5. Delete Behavior and Referential Integrity

Relasi foreign key menggunakan aturan berikut:

| Relationship          | On Delete |
| --------------------- | --------- |
| User → Articles       | Cascade   |
| User → Comments       | Cascade   |
| User → Likes          | Cascade   |
| User → Bookmarks      | Cascade   |
| User → Refresh Tokens | Cascade   |
| Category → Articles   | Set Null  |
| Article → Comments    | Cascade   |
| Article → Likes       | Cascade   |
| Article → Bookmarks   | Cascade   |

Konsekuensi:

- Menghapus user juga menghapus artikel, komentar, like, bookmark, dan refresh token miliknya.
- Menghapus artikel juga menghapus komentar, like, dan bookmark yang terkait.
- Menghapus kategori tidak menghapus artikel. `category_id` pada artikel terkait menjadi `NULL`.

## 6. Article Fields and Content

Artikel menyimpan konten utama dalam `content_markdown` bertipe text.

Status artikel menggunakan enum:

```prisma
enum ArticleStatus {
  DRAFT
  PUBLISHED
}
```

Field utama artikel:

| Field              | Keterangan                   |
| ------------------ | ---------------------------- |
| `id`               | UUID artikel                 |
| `user_id`          | Pemilik artikel              |
| `category_id`      | Kategori opsional            |
| `title`            | Judul artikel                |
| `slug`             | Identifier artikel yang unik |
| `content_markdown` | Konten Markdown              |
| `cover_image_path` | Path gambar cover di Storage |
| `status`           | Status publikasi             |
| `published_at`     | Waktu publikasi              |
| `created_at`       | Waktu pembuatan              |
| `updated_at`       | Waktu pembaruan              |

Cover image disimpan sebagai file di Supabase Storage. Database hanya menyimpan path file, bukan binary image.

## 7. Comment Fields and Business Rules

Komentar disimpan pada tabel `comments`.

Field utama:

| Field        | Keterangan                |
| ------------ | ------------------------- |
| `id`         | UUID komentar             |
| `user_id`    | User pembuat komentar     |
| `article_id` | Artikel yang dikomentari  |
| `content`    | Isi komentar              |
| `created_at` | Waktu komentar dibuat     |
| `updated_at` | Waktu komentar diperbarui |

### Comment Rules

1. Komentar hanya dapat dibuat oleh user terautentikasi.
2. Komentar hanya dapat dibuat pada artikel berstatus `PUBLISHED`.
3. Isi komentar tidak boleh kosong.
4. Panjang maksimal komentar adalah 5000 karakter.
5. Komentar publik diurutkan berdasarkan `created_at DESC`.
6. Update hanya dapat dilakukan oleh pemilik komentar dalam 15 menit sejak `created_at`.
7. Batas waktu edit tidak diperpanjang ketika komentar diperbarui.
8. Delete hanya dapat dilakukan oleh pemilik komentar dan tidak dibatasi waktu.

Batas waktu edit 15 menit diterapkan pada service layer backend. Tidak diperlukan kolom tambahan karena waktu pembuatan sudah dicatat melalui `created_at`.

## 8. Refresh Token Storage

Tabel `refresh_tokens` digunakan untuk mengelola sesi autentikasi.

Field utama:

| Field        | Keterangan                 |
| ------------ | -------------------------- |
| `id`         | UUID record                |
| `user_id`    | Pemilik token              |
| `token_hash` | SHA-256 hash refresh token |
| `expires_at` | Waktu kedaluwarsa          |
| `revoked_at` | Waktu pencabutan, nullable |
| `created_at` | Waktu pembuatan record     |

Refresh token tidak disimpan dalam bentuk plaintext.

Ketika refresh token dirotasi, record token lama dicabut dan record baru dibuat. Backend juga mendeteksi penggunaan kembali token yang sudah dicabut.

## 9. Prisma and Supabase Connection URLs

Environment variables:

- `DATABASE_URL`: connection string untuk runtime.
- `DIRECT_URL`: koneksi direct/session yang digunakan untuk migration.

Transaction Pooler umumnya menggunakan port 6543, sedangkan Direct Connection atau Session Pooler umumnya menggunakan port 5432.

Pada setup Prisma 6 saat ini:

- `schema.prisma` menggunakan `DATABASE_URL` sebagai URL datasource.
- `schema.prisma` menggunakan `DIRECT_URL` sebagai `directUrl`.
- `prisma.config.ts` mengarahkan migration ke `DIRECT_URL`.

Pastikan connection string sesuai konfigurasi Supabase. Jangan commit connection string asli.

## 10. Row Level Security

RLS diaktifkan pada tabel aplikasi dan privilege tabel langsung untuk role `anon` dan `authenticated` dicabut sesuai konfigurasi Supabase.

Backend menggunakan koneksi database dengan privilege tinggi. Koneksi tersebut dapat melewati RLS.

Karena itu:

- Jangan pernah mengekspos credential database ke frontend.
- Terapkan authentication dan ownership check di Express.
- Terapkan kebijakan RLS/revoke yang sama pada tabel baru bila diperlukan.
- Tinjau default privileges ketika menambah tabel atau sequence.
- Jangan menganggap RLS sebagai pengganti authorization di backend.

Express dan Prisma menjadi jalur akses database aplikasi.

## 11. Migration Policy

- Setiap perubahan schema harus memiliki migration bernama.
- Commit migration bersama perubahan kode.
- Jangan mengubah migration yang sudah diterapkan di environment bersama.
- Gunakan migration baru untuk perubahan schema berikutnya.
- Review SQL hasil generate sebelum menerapkan perubahan sensitif.
- Pastikan `schema.prisma`, migration, dan dokumentasi selalu konsisten.

## 12. Current Database Implementation

| Area                         | Status             |
| ---------------------------- | ------------------ |
| Users                        | Schema implemented |
| Categories                   | Schema implemented |
| Articles                     | Schema implemented |
| Comments                     | Schema implemented |
| Likes                        | Schema implemented |
| Bookmarks                    | Schema implemented |
| Refresh Tokens               | Schema implemented |
| Article relationships        | Defined            |
| Comment relationships        | Defined            |
| Cascade and SetNull behavior | Defined            |
| Initial database migration   | Applied previously |

Gunakan `prisma/schema.prisma` dan folder `prisma/migrations/` sebagai sumber kebenaran untuk struktur database yang sebenarnya.
