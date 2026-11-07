# 02: Requirements

## 1. Functional Requirements

### Account and Session

- FR-01: User dapat mendaftar menggunakan nama, username, email, dan password.
- FR-02: User dapat login menggunakan email atau username dan password.
- FR-03: User dapat logout. Refresh token yang aktif dicabut setelah .
- FR-04: Sistem dapat memberikan access token baru menggunakan refresh token yang valid.
- FR-05: Sistem menolak refresh token yang sudah expired, revoked, atau tidak valid.
- FR-06: Sistem mendeteksi penggunaan ulang refresh token yang sudah dirotasi sesuai mekanisme reuse detection.

### Articles

- FR-07: Guest dapat melihat daftar artikel berstatus `PUBLISHED`.
- FR-08: Guest dapat membaca detail artikel yang sudah dipublikasikan.
- FR-09: User yang sudah login dapat membuat artikel.
- FR-10: Penulis dapat menyimpan artikel sebagai draft.
- FR-11: Penulis dapat mempublikasikan artikel.
- FR-12: Penulis dapat mengedit atau menghapus artikel miliknya sendiri.
- FR-13: Artikel dapat diberikan kategori.
- FR-14: Artikel dapat mempunyai cover image.

### Interactions

- FR-15: User yang sudah login dapat menambahkan komentar pada artikel.
- FR-16: User yang sudah login dapat menghapus komentar miliknya sendiri. Peraturan edit komentar perlu diputuskan sebelum implementasi.
- FR-17: User yang sudah login dapat like/unlike artikel.
- FR-18: User yang sudah login dapat bookmark/remove bookmark artikel.

## 2. Non-functional Requirements

- NFR-01: Password yang disimpan dalam bentuk hash, bukan plaintext.
- NFR-02: Access token memiliki masa berlaku yang singkat selama 15 menit.
- NFR-03: Refresh token disimpan di browser sebagai cookie `HttpOnly` dan memiliki masa berlaku 14 hari.
- NFR-04: Refresh token mentah tidak disimpan di database. Database hanya menyimpan bentuk hash.
- NFR-05: Endpoint private harus memverifikasi access token.
- NFR-06: Backend harus memeriksa ownership sebelum User mengubah atau menghapus resource.
- NFR-07: Input User juga divalidasi di backend.
- NFR-08: Konten Markdown dirender dengan sanitasi HTML.
- NFR-09: Secret dan credential dilarang masuk ke repository.
- NFR-10: API menggunakan JSON dengan prefix `/api/v1`.

## 3. Business Rules

- Email dan username harus unik, tidak boleh sama.
- Password harus mengandung minimal 8 karakter. Validasi tambahan seperti batas maksimum dan format juga perlu ditegakkan.
- Artikel memiliki 2 pilihan status, yaitu `DRAFT` atau `PUBLISHED`.
- Hanya pemilik artikel yang boleh mengedit atau menghapus artikelnya.
- Guest hanya boleh mengakses artikel yang sudah dipublikasikan.
- Like dan bookmark unik untuk pasangan user-artikel.
- Penghapusan user menghapus data relasional miliknya sesuai foreign key cascade.
- Penghapusan kategori tidak menghapus artikel. Relasi kategori artikel menjadi null.

## 4. Assumptions and Open Discussion

Hal berikut perlu disepakati sebelum endpoint terkait difinalisasikan:

- Apakah komentar dapat diedit atau hanya bisa dihapus saja?
- Apakah penulis dapat menghapus artikel yang sudah dipublikasikan langsung?
- Apakah slug dibuat otomatis dari judul dan bagaimana menangani duplikasi slug?
- Apakah upload gambar artikel dibatasi hanya untuk pemilik artikel?
- Apakah halaman profil publik termasuk MVP?
- Apakah guest boleh melihat daftar kategori dan jumlah interaksi?

Jangan membuat perilaku frontend berdasarkan asumsi yang belum disepakati.
