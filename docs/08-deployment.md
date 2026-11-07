# 08: Development Guide

## 1. Prerequisites

- Node.js (gunakan versi yang disepakati tim; saat ini development lokal memakai Node.js 24).
- npm.
- Git.
- Project Supabase dengan PostgreSQL dan Storage.
- Postman atau API client yang setara.

## 2. Environment Variables

`.env` backend hanya untuk lokal dan tidak boleh di-commit. Simpan `.env.example` dengan nilai placeholder.

Variabel yang umum dipakai:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

JWT_ACCESS_SECRET="replace_with_random_secret"
JWT_REFRESH_SECRET="replace_with_a_different_random_secret"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d
```

Variabel Storage ditambahkan saat upload service diimplementasikan. Credential service-role hanya boleh ada di backend.

Buat JWT secret yang independen secara lokal, misalnya:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Jalankan perintah ini dua kali untuk mendapatkan secret access dan refresh yang berbeda. Jangan pernah menempelkan secret asli ke GitHub, chat, screenshot, atau environment frontend.

## 3. Backend Setup

Dari direktori backend:

```bash
npm install
npx prisma validate
npx prisma generate
```

Untuk environment lokal/database yang baru, jalankan migration menggunakan koneksi direct yang sudah dikonfigurasi:

```bash
npx prisma migrate dev
```

Jalankan server dengan script project jika sudah ada, atau gunakan:

```bash
node src/server.js
```

Base URL API lokal yang diharapkan:

```text
http://localhost:5000/api/v1
```

## 4. Frontend Setup

Dari direktori frontend:

```bash
npm install
npm run dev
```

Atur base URL API frontend untuk development lokal. Jika frontend dan backend berjalan di origin berbeda, konfigurasikan CORS di Express agar mengizinkan origin frontend dan credentials. Jangan gunakan wildcard origin bersama cookie yang membawa credentials.

## 5. Auth Smoke Test

Gunakan Postman:

1. Register dengan email dan username baru.
2. Login, lalu pastikan response access token dan refresh cookie muncul.
3. Panggil refresh dan pastikan cookie dirotasi.
4. Panggil refresh sekali lagi dengan cookie terbaru.
5. Gunakan ulang refresh token yang sudah dicabut dan pastikan ditolak.
6. Logout, lalu pastikan refresh token aktif dicabut dan cookie dihapus.

Skenario rotation dan reuse detection sudah dilaporkan lolos di environment development saat ini. Ulangi skenario tersebut setiap kali kode auth berubah.

## 6. Git Workflow

Alur yang disarankan:

```bash
git status
git add README.md docs/
git commit -m "docs: add project documentation"
git push origin main
```

Jika tim memakai feature branch, buat branch dokumentasi lalu buka pull request. Pastikan `.env` dan secret lain tidak ter-stage sebelum commit:

```bash
git status
git diff --cached
```

## 7. Team Workflow

- Frontend: implementasikan UI sesuai kontrak API yang disepakati.
- Backend: implementasikan API dan perbarui API reference saat perilakunya berubah.
- Kedua sisi (Frontend & Backend): diskusikan breaking change sebelum mengubah bentuk request/response.
- Perubahan database: backend membuat dan meng-commit migration Prisma; perbarui dokumentasi database.
- Test: catat langkah yang bisa direproduksi dan hasil yang diharapkan untuk setiap fitur yang selesai.

## 8. Pre-push Checklist

- [ ] README dan docs membedakan dengan akurat fitur yang sudah implemented dan yang masih planned.
- [ ] Tidak ada `.env` atau credential yang ter-stage.
- [ ] File schema Prisma dan migration sudah di-commit jika relevan.
- [ ] Path API di frontend sesuai dengan API reference saat ini.
- [ ] Setiap perubahan kontrak endpoint sudah didokumentasikan.
- [ ] `git diff --cached` sudah ditinjau.

## 9. Deployment Notes

Target deployment adalah satu Render Web Service yang melayani frontend hasil build dan Express API dari satu origin. Konfirmasi perintah build dan start yang sebenarnya, static file serving, SPA fallback, environment variable, dan health check sebelum deploy. Gunakan environment variable production di Render, bukan file yang di-commit.

Untuk perubahan database di production, terapkan migration yang sudah di-commit lewat workflow migration untuk deployment (pada Prisma, biasanya `prisma migrate deploy`). Jangan jalankan perintah migration untuk development di production.
