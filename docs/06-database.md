# 06: Database

## 1. Database

Menggunakan PostgreSQL di Supabase. Prisma digunakan sebagai ORM dan alat migration.

## 2. Tables

Schema awal aplikasi berisi enam tabel inti, ditambah `refresh_tokens` untuk manajemen sesi.

| Table            | Fungsi                                            |
| ---------------- | ------------------------------------------------- |
| `users`          | Akun dan profil pengguna                          |
| `categories`     | Kategori artikel                                  |
| `articles`       | Konten artikel dan status publikasi artikel       |
| `comments`       | Komentar user pada artikel                        |
| `likes`          | Like milik user pada artikel                      |
| `bookmarks`      | Bookmark artikel user                             |
| `refresh_tokens` | Record refresh token (hash) dan status pencabutan |

## 3. Main Relationships

```text
users 1 ─── * articles
users 1 ─── * comments
users 1 ─── * likes
users 1 ─── * bookmarks
users 1 ─── * refresh_tokens

categories 1 ─── * articles (kategori artikel bersifat opsional)

articles 1 ─── * comments
articles 1 ─── * likes
articles 1 ─── * bookmarks
```

## 4. Important Constraints

- `users.email` unique.
- `users.username` unique.
- `categories.name` dan `categories.slug` unque.
- `articles.slug` unique.
- `likes` unique pada `(user_id, article_id)`.
- `bookmarks` unique pada `(user_id, article_id)`.
- `refresh_tokens.token_hash` unique.
- Foreign key menggunakan UUID.
- Menghapus user ikut menghapus data turunannya (cascade).
- Menghapus kategori mengosongkan referensi kategori pada artikel terkait (set null).

Gunakan `prisma/schema.prisma` sebagai sumber kebenaran untuk definisi field dan database mapping yang tepat.

## 5. Article Fields and Content

Konten artikel disimpan di `content_markdown` sebagai text. Status artikel memakai:

- `DRAFT`
- `PUBLISHED`

`published_at` bersifat nullable dan mencatat waktu publikasi saat artikel diterbitkan. Cover image disimpan sebagai path Storage, bukan data binary.

## 6. Refresh token storage

Tabel `refresh_tokens` menyimpan:

- ID record (UUID).
- Foreign key ke user.
- Hash SHA-256 dari refresh token.
- Waktu kedaluwarsa.
- Waktu pencabutan (opsional).
- Waktu pembuatan.

## 7. Prisma and Supabase connection URLs

Environment variable:

- `DATABASE_URL`: connection string untuk runtime; transaction pooler dapat memakai port 6543.
- `DIRECT_URL`: koneksi direct/session untuk operasi migration; gunakan koneksi yang kompatibel dengan Prisma migration, umumnya port 5432.

Pada setup Prisma 6 saat ini, periksa `prisma.config.ts` dan `schema.prisma` agar perintah migration memakai direct URL yang dimaksud. Jangan commit connection string asli.

## 8. Row Level Security

RLS diaktifkan pada tabel aplikasi, dan privilege tabel langsung untuk `anon`/`authenticated` dicabut sesuai konfigurasi di Supabase.

Backend memakai koneksi database dengan privilege tinggi, sehingga koneksi ini dapat melewati RLS. Karena itu:

- Jangan pernah meng-expose credential database dengan privilege ke frontend.
- Terapkan authentication dan ownership check di Express.
- Terapkan kebijakan RLS/revoke yang sama pada tabel baru bila sesuai.
- Tinjau default privileges saat menambah tabel atau sequence.

## 9. Migration policy

- Setiap perubahan schema harus punya migration dengan nama.
- Commit file migration bersama perubahan kodenya.
- Jangan edit migration yang sudah diterapkan di environment bersama; buat migration baru.
- Review SQL hasil generate sebelum menerapkan perubahan schema yang sensitif.
- Jaga dokumen ini tetap selaras dengan `schema.prisma` dan riwayat migration.
