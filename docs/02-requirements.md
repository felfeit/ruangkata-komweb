# 02 — Requirements

## 1. Functional requirements

### Account and session

- FR-01: Pengguna dapat mendaftar menggunakan nama, username, email, dan password.
- FR-02: Pengguna dapat login menggunakan email atau username dan password.
- FR-03: Pengguna dapat logout; refresh token aktif dicabut.
- FR-04: Sistem dapat menerbitkan access token baru menggunakan refresh token yang valid.
- FR-05: Sistem menolak refresh token yang sudah expired, revoked, atau tidak valid.
- FR-06: Sistem mendeteksi penggunaan ulang refresh token yang sudah dirotasi sesuai mekanisme reuse detection.

### Articles

- FR-07: Guest dapat melihat daftar artikel berstatus `PUBLISHED`.
- FR-08: Guest dapat melihat detail artikel yang sudah dipublikasikan.
- FR-09: Pengguna login dapat membuat artikel.
- FR-10: Penulis dapat menyimpan artikel sebagai draft.
- FR-11: Penulis dapat menerbitkan artikel.
- FR-12: Penulis dapat mengedit atau menghapus artikel miliknya sendiri.
- FR-13: Artikel dapat dikaitkan dengan kategori.
- FR-14: Artikel dapat memiliki cover image.

### Interactions

- FR-15: Pengguna login dapat menambahkan komentar pada artikel.
- FR-16: Pengguna dapat menghapus komentar miliknya sendiri; aturan edit komentar perlu diputuskan sebelum implementasi.
- FR-17: Pengguna login dapat like/unlike artikel.
- FR-18: Pengguna login dapat bookmark/remove bookmark artikel.

## 2. Non-functional requirements

- NFR-01: Password disimpan dalam bentuk hash, bukan plaintext.
- NFR-02: Access token memiliki masa berlaku singkat (15 menit).
- NFR-03: Refresh token disimpan di browser sebagai cookie `HttpOnly` dan memiliki masa berlaku 14 hari.
- NFR-04: Refresh token mentah tidak disimpan di database; database menyimpan hash.
- NFR-05: Endpoint privat harus memverifikasi access token.
- NFR-06: Backend harus memeriksa ownership sebelum pengguna mengubah atau menghapus resource.
- NFR-07: Input pengguna divalidasi di backend.
- NFR-08: Konten Markdown dirender dengan sanitasi HTML.
- NFR-09: Secret dan credential tidak boleh masuk ke repository.
- NFR-10: API menggunakan JSON dan prefix `/api/v1`.

## 3. Business rules

- Email dan username harus unik.
- Password minimal 8 karakter (validasi tambahan seperti batas maksimum dan format perlu ditegakkan).
- Artikel memiliki status `DRAFT` atau `PUBLISHED`.
- Hanya pemilik artikel yang boleh mengedit atau menghapus artikelnya.
- Guest hanya boleh mengakses artikel yang sudah dipublikasikan.
- Like dan bookmark unik untuk pasangan user-artikel.
- Penghapusan user menghapus data relasional miliknya sesuai foreign key cascade.
- Penghapusan kategori tidak menghapus artikel; relasi kategori artikel menjadi null.

## 4. Assumptions and open decisions

Hal berikut perlu disepakati sebelum endpoint terkait dibekukan:

- Apakah komentar dapat diedit atau hanya dihapus?
- Apakah penulis dapat menghapus artikel yang sudah dipublikasikan langsung?
- Apakah slug dibuat otomatis dari judul dan bagaimana menangani duplikasi?
- Apakah upload gambar artikel dibatasi hanya untuk pemilik artikel?
- Apakah halaman profil publik termasuk MVP?
- Apakah guest boleh melihat daftar kategori dan jumlah interaksi?

Jangan membuat perilaku frontend berdasarkan asumsi yang belum disepakati.
