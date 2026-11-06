# 04 — Frontend Guide

## 1. Stack

- React
- Vite
- TypeScript

Frontend bertanggung jawab atas tampilan, navigasi, validasi UX, state sesi, dan komunikasi HTTP ke backend.

## 2. Prinsip integrasi

- Gunakan Express REST API sebagai satu-satunya sumber data aplikasi.
- Jangan query tabel Supabase secara langsung dari browser.
- Jangan letakkan database password atau Supabase service-role key di environment frontend.
- Simpan base URL API melalui environment variable frontend.
- Gunakan tipe TypeScript untuk request/response API.

## 3. Authentication state

Rekomendasi pengelolaan token:

- Access token disimpan di memory aplikasi (Context/state).
- Refresh token dikelola browser melalui cookie `HttpOnly`; JavaScript tidak boleh membaca token tersebut.
- Jangan simpan refresh token di `localStorage` atau `sessionStorage`.
- Request yang perlu cookie harus menggunakan `credentials: "include"`.

Contoh request login:

```ts
const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ identifier, password }),
});

const data = await response.json();
// Simpan data.accessToken di memory/state aplikasi.
```

Contoh request privat:

```ts
const response = await fetch(`${API_BASE_URL}/api/v1/articles`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## 4. Session bootstrap and refresh

Saat aplikasi pertama kali dibuka atau halaman di-refresh:

1. Access token di memory sudah hilang.
2. Frontend memanggil `POST /api/v1/auth/refresh` dengan `credentials: "include"`.
3. Browser mengirim cookie refresh token secara otomatis.
4. Jika berhasil, simpan access token baru di memory.
5. Jika gagal karena sesi tidak valid, tampilkan kondisi guest/login.

Karena refresh token menggunakan rotation, implementasikan single-flight refresh: beberapa request yang menerima 401 tidak boleh memanggil refresh secara paralel. Satu refresh request dijalankan, request lain menunggu hasilnya. Hindari infinite retry; jika refresh gagal, reset session.

Jangan menganggap setiap 401 pasti berarti access token expired. Response 401 dari login, refresh, atau endpoint lain harus ditangani sesuai konteks.

## 5. Markdown content

- Editor dapat menggunakan Markdown sebagai format konten.
- Preview harus merepresentasikan hasil render yang aman.
- HTML hasil render harus disanitasi.
- Jangan menyisipkan raw HTML dari user ke DOM tanpa sanitasi.

## 6. Suggested frontend modules

Struktur ini rekomendasi, bukan keharusan:

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── articles/
│   ├── comments/
│   ├── likes/
│   └── bookmarks/
├── lib/
│   └── api/
├── hooks/
├── types/
└── pages/
```

## 7. Current integration status

- Auth endpoint: tersedia di backend dan perlu diuji terhadap response aktual.
- Article/comment/like/bookmark endpoint: belum dinyatakan tersedia; tunggu kontrak API diperbarui.
- Jangan membuat mock response permanen seolah-olah sudah menjadi kontrak backend.
